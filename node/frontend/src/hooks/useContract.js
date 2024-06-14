import { useAccount, useChains, usePublicClient, useWalletClient, useEstimateFeesPerGas } from "wagmi"
// import { parseEther, formatEther } from "viem";
import { getContract } from "viem";
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

    const newTask = async() => {
        console.log(contract);
        console.log(feeData);
    }


    return {
        newTask
    }
}

export default useContract;
