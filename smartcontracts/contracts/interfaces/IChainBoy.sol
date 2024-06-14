// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

interface IChainBoy {
    struct Request {
        bool fulfilled; // whether the task has been successfully fulfilled
        bool exists;
        string result;
        address requester;
        uint256 counter;
        string ipfs_function;
        bytes32[] variables;
    }

    struct Solution {
        string result;
        bytes32 sign;
    }

    event Initialized(address _admin);
    event NewRequest(bytes32 _request_id);
    // event NewResponse(bytes32 _request_id, bytes32 _result, bytes32 _sign);

}
