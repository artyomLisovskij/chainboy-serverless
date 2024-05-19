// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

contract IPFSTasks {
    mapping(string => bool) task_existance;
    mapping(string => string) task_results;
    event NewTask(string _ipfs_hash);
    event TaskCompleted(string _ipfs_hash, string _result);

    function add_task(string memory _ipfs_hash) public{
        require(!task_existance[_ipfs_hash], 'already exists');
        task_existance[_ipfs_hash] = true;
        emit NewTask(_ipfs_hash);
    }

    function complete_task(string memory _ipfs_hash, string memory _result) public{
        require(task_existance[_ipfs_hash], 'not exist');
        require(bytes(task_results[_ipfs_hash]).length == 0, 'already got result');
        require(bytes(_result).length != 0, 'empty result');
        task_results[_ipfs_hash] = _result;
        emit TaskCompleted(_ipfs_hash, _result);
    }
}