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
            for (let index = 0; index < logs.length; index++) {
                const log = logs[index];
                if (log.transactionHash === task_txid && log.eventName === "NewRequest") {
                    dispatch(setRequestId(log.args._request_id))
                    request_id = log.args._request_id;
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
                if (log.eventName === 'NewSolution' && log.args._hash == request_id) {
                    if (!solutions[log.args._signer]) {
                        solutions[log.args._signer] = log.args._solution;
                        console.log("Solution from node " + log.args._signer + " got, result is: " + log.args._solution)
                        toast.success("Solution from node " + log.args._signer + " got, result is: " + log.args._solution, {
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
                if (log.eventName === 'NewConsensus' && log.args._hash == request_id) {
                    if (!consensus) {
                        consensus = true;
                        console.log("Consensus from node " + log.args._signer + " got, consensus result is: " + log.args._solution)
                        toast.success("Consensus from node " + log.args._signer + " got, consensus result is: " + log.args._solution, {
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
        }
    })

    return {
        newTask,
        unwatch
    }
}

export default useContract;
