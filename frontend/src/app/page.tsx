"use client";

declare global {
  interface Window {
    ethereum?: any;
  }
}

import { useState } from "react";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const CONTRACT_ADDRESS = "0x55a9B18B2Cb25b86fc6aed3b27C6F077F5c798C0";

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [freelancer, setFreelancer] = useState("");
  const [criteria, setCriteria] = useState("");
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [milestoneData, setMilestoneData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const client = createClient({ chain: studionet });

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xF22F" }],
      });
    } catch (err: any) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0xF22F",
            chainName: "GenLayer Studio",
            nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
            rpcUrls: ["https://studio.genlayer.com/api"],
            blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
          }],
        });
      }
    }
  };

  const createMilestone = async () => {
    if (!account) return alert("Connect wallet first");
    setLoading(true);
    setStatus("Creating milestone...");
    try {
      const writeClient = createClient({
        chain: studionet,
        account: account as `0x${string}`,
        provider: window.ethereum,
      }) as any;

      await writeClient.connect("studionet");

      const tx = await writeClient.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "create_milestone",
        args: [freelancer, criteria],
        value: BigInt("1000000000000000000"),
      });

      setStatus(`Created! Tx: ${String(tx).slice(0, 10)}...`);
    } catch (e: any) {
      setStatus("Error: " + e.message);
    }
    setLoading(false);
  };

  const submitDeliverable = async () => {
    if (!account) return alert("Connect wallet first");
    setLoading(true);
    setStatus("Submitting deliverable...");
    try {
      const writeClient = createClient({
        chain: studionet,
        account: account as `0x${string}`,
        provider: window.ethereum,
      }) as any;

      await writeClient.connect("studionet");

      const tx = await writeClient.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "submit_deliverable",
        args: [milestoneId, deliverableUrl],
      });

      setStatus(`Submitted! Tx: ${String(tx).slice(0, 10)}...`);
    } catch (e: any) {
      setStatus("Error: " + e.message);
    }
    setLoading(false);
  };

  const resolveMilestone = async () => {
    if (!account) return alert("Connect wallet first");
    setLoading(true);
    setStatus("Resolving... This may take a minute");
    try {
      const writeClient = createClient({
        chain: studionet,
        account: account as `0x${string}`,
        provider: window.ethereum,
      }) as any;

      await writeClient.connect("studionet");

      const tx = await writeClient.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "resolve",
        args: [milestoneId],
      });

      setStatus(`Resolving... Tx: ${String(tx).slice(0, 10)}...`);
    } catch (e: any) {
      setStatus("Error: " + e.message);
    }
    setLoading(false);
  };

  const getMilestone = async () => {
    setLoading(true);
    try {
      const data = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_milestone",
        args: [milestoneId],
      });
      setMilestoneData(data);
      setStatus("Milestone loaded");
    } catch (e: any) {
      setStatus("Error loading: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            MilestoneEscrow
          </h1>
          <p className="text-slate-400 mt-3 text-lg">
            AI-powered freelance escrow on GenLayer
          </p>
          <button
            onClick={connectWallet}
            className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium transition"
          >
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
          </button>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Create Milestone</h2>
            <input
              className="w-full mb-3 px-4 py-3 bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Freelancer address"
              value={freelancer}
              onChange={(e) => setFreelancer(e.target.value)}
            />
            <textarea
              className="w-full mb-3 px-4 py-3 bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Criteria (natural language)"
              rows={3}
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
            />
            <button
              onClick={createMilestone}
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium disabled:opacity-50"
            >
              Create (1 GEN)
            </button>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-semibold">Manage Milestone</h2>
            <input
              className="w-full px-4 py-3 bg-slate-800 rounded-xl outline-none"
              placeholder="Milestone ID"
              value={milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
            />
            <input
              className="w-full px-4 py-3 bg-slate-800 rounded-xl outline-none"
              placeholder="Deliverable URL"
              value={deliverableUrl}
              onChange={(e) => setDeliverableUrl(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={submitDeliverable}
                disabled={loading}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl disabled:opacity-50"
              >
                Submit
              </button>
              <button
                onClick={resolveMilestone}
                disabled={loading}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl disabled:opacity-50"
              >
                Resolve
              </button>
            </div>
            <button
              onClick={getMilestone}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl"
            >
              View Milestone
            </button>
          </div>
        </div>

        {status && (
          <div className="mt-6 p-4 bg-slate-900 border border-slate-800 rounded-xl text-sm">
            {status}
          </div>
        )}

        {milestoneData && (
          <div className="mt-6 p-6 bg-slate-900/70 border border-slate-800 rounded-2xl">
            <h3 className="font-semibold mb-3">Milestone Details</h3>
            <pre className="text-sm text-slate-300 overflow-auto">
              {JSON.stringify(milestoneData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
