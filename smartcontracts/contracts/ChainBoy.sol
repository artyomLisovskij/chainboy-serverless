// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import "./interfaces/IChainBoy.sol";
import "./interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// Returns the decimal string representation of value
function itoa(uint value) pure returns (string memory) {
    // Count the length of the decimal string representation
    uint length = 1;
    uint v = value;
    while ((v /= 10) != 0) {
        length++;
    }

    // Allocated enough bytes
    bytes memory result = new bytes(length);

    // Place each ASCII string character in the string,
    // right to left
    while (true) {
        length--;

        // The ASCII value of the modulo 10 value
        result[length] = bytes1(uint8(0x30 + (value % 10)));

        value /= 10;

        if (length == 0) {
            break;
        }
    }

    return string(result);
}

contract ChainBoy is IChainBoy, Initializable, OwnableUpgradeable {
    IERC20 token;
    mapping(address => uint256) public address_counter; // alternative to address's nonce
    mapping(bytes32 => Request) public requests;
    mapping(bytes32 => mapping(address => Solution)) public solutions;
    mapping(bytes32 => mapping(string => address[])) public solution_signers;
    mapping(bytes32 => mapping(string => bytes)) public consenus;
    mapping(bytes32 => address[]) public request_solvers;

    function initialize(address _token_address) public initializer {
        __Ownable_init(msg.sender);
        token = IERC20(_token_address);
        emit Initialized(msg.sender);
    }

    function newRequest(string memory _ipfsFunction, bytes32 _variable) external payable returns (bytes32) {
        require(msg.value >= 1e14, "money problem");
        bytes32 _hash = keccak256(abi.encodePacked(block.chainid, msg.sender, address_counter[msg.sender]));
        require(!requests[_hash].exists, "already exists");
        requests[_hash] = Request({
            value: msg.value,
            reward_chain_id: block.chainid,
            fulfilled: false,
            exists: true,
            result: "",
            requester: msg.sender,
            counter: address_counter[msg.sender],
            ipfs_function: _ipfsFunction,
            variable: _variable
        });
        address_counter[msg.sender]++;
        emit NewRequest(_hash, _ipfsFunction, _variable);
        return _hash;
    }

    function newSolution(bytes32 _hash, string memory _solution, bytes memory _sign) public {
        require(requests[_hash].exists, "not exists");
        require(!requests[_hash].fulfilled, "already fulfilled");
        address _signer = recoverSigner(keccak256(abi.encodePacked(_hash, _solution)), bytes(_sign));
        require(token.balanceOf(_signer) > 0, "not validator");
        require(!solutions[_hash][_signer].got, "already solved");
        request_solvers[_hash].push(_signer);
        solutions[_hash][_signer] = Solution({
            result: _solution,
            sign: _sign,
            got: true
        });
        solution_signers[_hash][_solution].push(_signer);
        emit NewSolution(_hash, _signer, _solution);
    }

    function checkConsensus(bytes32 _hash, string memory _solution, bytes memory _sign) public payable{
        require(!requests[_hash].fulfilled, "already fulfilled");
        require(requests[_hash].reward_chain_id == block.chainid, "not reward chain");
        address _signer = recoverSigner(keccak256(abi.encodePacked(_hash, _solution)), bytes(_sign));
        require(token.balanceOf(_signer) > 0, "not validator");
        uint256 _half_amount = requests[_hash].value / 2;
        uint256 _consensus;
        for (uint256 index = 0; index < solution_signers[_hash][_solution].length; index++) {
            uint256 _balance = token.balanceOf(solution_signers[_hash][_solution][index]);
            _consensus += _balance;
            uint256 _amount = _half_amount * _balance / token.totalSupply();
            payable(solution_signers[_hash][_solution][index]).transfer(_amount);
            emit RewardSent(_hash, solution_signers[_hash][_solution][index], _amount);
        }
        require(_consensus * 10000 / token.totalSupply() > 5000, "not consensus");
        requests[_hash].fulfilled = true;
        requests[_hash].result = _solution;
        consenus[_hash][_solution] = _sign;
        payable(_signer).transfer(_half_amount);
        emit RewardSent(_hash, _signer, _half_amount);
        emit NewConsensus(_hash, _signer, _solution, _sign);
    }

    function getResult(bytes32 _hash) public view returns (string memory) {
        require(requests[_hash].fulfilled, "not fulfilled");
        return requests[_hash].result;
    }

    function crosschainConsensusBatch(bytes32 _hash, bytes[] calldata _signs, string memory _solution, bytes memory _sign) public {
        require(requests[_hash].exists, "not exists");
        require(!requests[_hash].fulfilled, "already fulfilled");
        address _consensus_signer = recoverSigner(keccak256(abi.encodePacked(_hash, _solution)), bytes(_sign));
        require(token.balanceOf(_consensus_signer) > 0, "not validator");
        uint256 _consensus;
        for (uint256 index = 0; index < _signs.length; index++) {
            address _signer = recoverSigner(keccak256(abi.encodePacked(_hash, _solution)), bytes(_signs[index]));
            require(token.balanceOf(_signer) > 0, "not validator");
            require(!solutions[_hash][_signer].got, "already solved");
            request_solvers[_hash].push(_signer);
            solutions[_hash][_signer] = Solution({
                result: _solution,
                sign: _sign,
                got: true
            });
            solution_signers[_hash][_solution].push(_signer);
            _consensus += token.balanceOf(solution_signers[_hash][_solution][index]);
            emit NewSolutionBatch(_hash, _signer, _solution);
        }
        if (_consensus * 10000 / token.totalSupply() > 5000) {
            requests[_hash].fulfilled = true;
            requests[_hash].result = _solution;
            consenus[_hash][_solution] = _sign;
            emit NewConsensus(_hash, _consensus_signer, _solution, _sign);
        }
    }

    function recoverSigner(bytes32 message, bytes memory sig) public pure returns (address) {
        // Sanity check before using assembly
        require(sig.length == 65, "invalid signature");

        // Decompose the raw signature into r, s and v (note the order)
        uint8 v;
        bytes32 r;
        bytes32 s;

        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        return _ecrecover(message, v, r, s);
    }

    function _ecrecover(bytes32 message, uint8 v, bytes32 r, bytes32 s) internal pure returns (address) {
        // Compute the EIP-191 prefixed message
        bytes memory prefixedMessage = abi.encodePacked(
            "\x19Ethereum Signed Message:\n",
            itoa(message.length),
            message
        );

        // Compute the message digest
        bytes32 digest = keccak256(prefixedMessage);

        // Use the native ecrecover provided by the EVM
        return ecrecover(digest, v, r, s);
    }
}
