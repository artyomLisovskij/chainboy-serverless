// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import "./interfaces/IChainBoy.sol";
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
    mapping(address => uint256) public address_counter;
    mapping(bytes32 => Request) public requests;
    mapping(bytes32 => mapping(address => Solution)) public solutions;
    mapping(bytes32 => address[]) public request_solvers;

    modifier onlyValidator() {
        require(token.balanceOf[msg.sender] > 0, "not validator");
        _;
    }

    function initialize(address _token_address) public initializer {
        __Ownable_init(msg.sender);
        token = IERC20(_token_address);
        emit Initialized(msg.sender);
    }

    function newRequest(string _ipfsFunction, bytes32[] _variables) external returns (bytes32) {
        require(!requests[hash].exists, "already exists");
        bytes32 hash = keccak256(block.chain_id, msg.sender, address_counter[msg.sender]);
        requests[hash] = Request({
            fulfilled: false,
            exists: true,
            result: "",
            requester: msg.sender,
            counter: address_counter[msg.sender],
            ipfs_function: _ipfsFunction,
            variables: _variables
        });
        address_counter[msg.sender]++;
        emit NewRequest(hash);
        return hash;
    }

    function newSolution(bytes32 _hash, string _result, bytes32 _sign) external returns (bytes32) {
        require(requests[_hash].exists, "not exists");
        require(!requests[_hash].fulfilled, "already fulfilled");
        require(solutions[_hash][msg.sender].sign == bytes32(0), "already solved");
        // check sign
        // TODO: recoverSigner(hash, _sign)
        request_solvers[_hash].push(msg.sender);
        solutions[_hash][msg.sender] = Solution({
            result: _result,
            sign: _sign
        });
        address_counter[msg.sender]++;
        emit NewRequest(hash);
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
