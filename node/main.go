package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/multiformats/go-multiaddr"

	"github.com/filecoin-project/lotus/chain/types"
	"github.com/filecoin-project/lotus/chain/types/ethtypes"
	"github.com/filecoin-project/lotus/itests/kit"
	"github.com/filecoin-project/lotus/node/config"
)

type KitNode struct {
	FullNode *kit.TestFullNode
	Miner    *kit.TestMiner
	Ready    bool
}

var node KitNode
var ctx context.Context

func initKit(blockTimeMs int64) {
	blockTime := time.Duration(blockTimeMs) * time.Millisecond

	full, miner, ens := kit.EnsembleMinimal(
		&testing.T{},
		kit.MockProofs(),
		kit.ThroughRPC(),
		kit.WithCfgOpt(func(cfg *config.FullNode) error {
			cfg.Fevm.EnableEthRPC = true
			return nil
		}),
	)
	ens.InterconnectAll().BeginMining(blockTime)
	kit.QuietMiningLogs()

	node.FullNode = full
	node.Miner = miner
	node.Ready = true
}

func killKit(ctx context.Context) {
	if node.Ready {
		node.FullNode = nil
		node.Miner = nil
		node.Ready = false
	}
}

func MultiAddrToHttp(m multiaddr.Multiaddr) (string, error) {
	sp := strings.Split(m.String(), "/")
	if len(sp) != 5 {
		return "", fmt.Errorf("incorrect multiaddr %s", m.String())
	}
	host, port := sp[2], sp[4]
	return fmt.Sprintf("http://%s:%s", host, port), nil
}

func handleReady(w http.ResponseWriter, req *http.Request) {
	resp := map[string]interface{}{"ready": node.Ready}
	output, err := json.Marshal(resp)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(output)
}

func handleRestart(w http.ResponseWriter, req *http.Request) {
	killKit(ctx)

	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	var data struct {
		BlockTimeMs int64 `json:"blockTimeMs"`
	}

	if err := json.Unmarshal(body, &data); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	initKit(data.BlockTimeMs)

	resp := map[string]interface{}{"ready": node.Ready}
	output, err := json.Marshal(resp)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(output)
}

func handleUrls(w http.ResponseWriter, req *http.Request) {
	resp := map[string]interface{}{
		"ready": node.Ready,
	}

	nodeUrl, err := MultiAddrToHttp(node.FullNode.ListenAddr)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	minerUrl, err := MultiAddrToHttp(node.Miner.ListenAddr)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	if node.Ready {
		resp["node_url"] = nodeUrl
		resp["miner_url"] = minerUrl
	}
	output, err := json.Marshal(resp)
	if err != nil {
		w.Write([]byte(fmt.Sprintf("%v", err)))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(output)
}

func handleSend(w http.ResponseWriter, req *http.Request) {
	if !node.Ready {
		http.Error(w, "the node is not ready yet", 400)
		return
	}

	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	var data struct {
		Receiver string `json:"receiver"`
		Amount   uint64 `json:"amount"`
	}

	if err := json.Unmarshal(body, &data); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	receiver, err := ethtypes.ParseEthAddress(data.Receiver)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	receiverFilAddr, err := receiver.ToFilecoinAddress()
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	senderAddr, err := node.FullNode.WalletDefaultAddress(ctx)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	msg := &types.Message{
		From:  senderAddr,
		To:    receiverFilAddr,
		Value: types.FromFil(data.Amount),
	}

	sm, err := node.FullNode.MpoolPushMessage(ctx, msg, nil)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	node.FullNode.WaitMsg(ctx, sm.Cid())

	bal, err := node.FullNode.WalletBalance(ctx, receiverFilAddr)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	resp := map[string]interface{}{
		"balance": bal.String(),
	}

	respJson, err := json.Marshal(resp)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(respJson)
}

func main() {
	_ctx, cancel := context.WithTimeout(context.Background(), 10*time.Hour)
	ctx = _ctx
	defer cancel()

	http.HandleFunc("/ready", handleReady)
	http.HandleFunc("/restart", handleRestart)
	http.HandleFunc("/urls", handleUrls)
	http.HandleFunc("/send", handleSend)

	initKit(200)

	http.ListenAndServe(":8090", nil)
}
