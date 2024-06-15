import { useAccount, useChains, usePublicClient, useWalletClient, useEstimateFeesPerGas } from "wagmi"
import { parseEther } from "viem";
import { getContract } from "viem";
import abi from "../abi.json";
import { useSelector } from 'react-redux';
import { setRequestId } from "../redux/base/base"
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify';

const useContract = () => {
    const dispatch = useDispatch();
    const chains = useChains();
    const { chain } = useAccount();

    const feeData = useEstimateFeesPerGas();

    const publicClient = usePublicClient({
        chainId: chains[0].id,
    });
    const { data: walletClient } = useWalletClient({
        chainId: chain?.id,
    });
    const contract = getContract({
        address: process.env.REACT_APP_CONTRACT_ADDRESS,
        abi: abi,
        client: {
            public: publicClient,
            wallet: walletClient,
        }
    });
    const { task_txid } = useSelector((state) => state.base);
    let request_id = false;
    let solutions = {};
    let consensus = false;
    const newTask = async(amount, ipfs, variable) => {
        consensus = false;
        solutions = {};
        const gasLimit = await contract.estimateGas.newRequest({
            args: [
                ipfs,
                variable, 
            ],
            value: parseEther(parseFloat(amount).toFixed(5).toString())
        });
        const buyTx = await contract.write.newRequest({
            args: [
                ipfs,
                variable
            ],
            value: parseEther(parseFloat(amount).toFixed(5).toString()),
            gas: gasLimit,
            gasPrice: feeData.gasPrice
        })
        return buyTx
    }

    const unwatch = publicClient.watchContractEvent({
        address: process.env.REACT_APP_CONTRACT_ADDRESS,
        abi: abi,
        onLogs: function(logs) {
            console.log(logs[0].eventName)
            console.log(logs[0])
            if (logs[0].transactionHash === task_txid && logs[0].eventName === "NewRequest") {
                dispatch(setRequestId(logs[0].args._request_id))
                request_id = logs[0].args._request_id;
                toast.success("Your task got unique request id: " + request_id + ". Now wait for nodes solutions and consensus across their solutions.", {
                    icon: "🕗",
                    theme: 'dark',
                    position: "top-center",
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    type: "success",
                    isLoading: false
                });
            }
            if (logs[0].eventName === 'NewSolution' && logs[0].args._hash == request_id) {
                if (!solutions[logs[0].args._signer]) {
                    solutions[logs[0].args._signer] = logs[0].args._solution;
                    console.log("Solution from node " + logs[0].args._signer + " got, result is: " + logs[0].args._solution)
                    toast.success("Solution from node " + logs[0].args._signer + " got, result is: " + logs[0].args._solution, {
                        icon: "🟡",
                        theme: 'dark',
                        position: "top-center",
                        autoClose: false,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        type: "success",
                        isLoading: false
                    });
                }
            }
            if (logs[0].eventName === 'NewConsensus' && logs[0].args._hash == request_id) {
                if (!consensus) {
                    consensus = true;
                    console.log("Consensus from node " + logs[0].args._signer + " got, consensus result is: " + logs[0].args._solution)
                    toast.success("Consensus from node " + logs[0].args._signer + " got, consensus result is: " + logs[0].args._solution, {
                        icon: "🟢",
                        theme: 'dark',
                        position: "top-center",
                        autoClose: false,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        type: "success",
                        isLoading: false
                    });
                }
            }
        }
    })

    return {
        newTask,
        unwatch
    }
}

export default useContract;
