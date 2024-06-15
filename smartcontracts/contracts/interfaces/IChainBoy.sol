// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

interface IChainBoy {
    struct Request {
        uint256 reward_chain_id;
        uint256 value;
        bool fulfilled; // whether the task has been successfully fulfilled
        bool exists;
        string result;
        address requester;
        uint256 counter;
        string ipfs_function;
        bytes32 variable; // TODO: make array in future
    }

    struct Solution {
        string result;
        bytes sign;
        bool got;
    }

    event Initialized(address _admin);
    event NewRequest(bytes32 _request_id, string _ipfs, bytes32 _variable);
    event NewSolutionBatch(bytes32 _hash, address _signer, string _solution);
    event NewSolution(bytes32 _hash, address _signer, string _solution);
    event NewConsensus(bytes32 _hash, address _signer, string _solution, bytes _sign);
    event RewardSent(bytes32 _hash, address _signer, uint256 _amount);
}
