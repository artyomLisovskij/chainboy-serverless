import { useAccount, useChains, usePublicClient, useWalletClient, useEstimateFeesPerGas } from "wagmi"
import { parseEther } from "viem";
import { getContract, stringToBytes } from "viem";
import abi from "../abi.json";

const useContract = () => {
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

    const newTask = async(amount, ipfs, variable) => {
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
    const getResult = async(request_id) => {
        return await contract.read.getResult([
            stringToBytes(
                request_id, 
                { size: 32 } 
            )
        ])
    }

    const unwatch = publicClient.watchContractEvent({
        address: process.env.REACT_APP_CONTRACT_ADDRESS,
        abi: abi,
        onLogs: function(logs) {
            console.log(logs)
        }
    })

    return {
        newTask,
        unwatch, 
        getResult
    }
}

export default useContract;
