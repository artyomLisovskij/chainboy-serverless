import React, { useState } from 'react';
// import { useSelector } from 'react-redux'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useDisconnect } from "wagmi";
// import useContract from "../../hooks/useContract";
// import { setIsOpenSubmitted, setIsOpenConnect } from "../../redux/base/base"
// import { useDispatch } from 'react-redux'
// import { toast } from 'react-toastify';
import axios from "axios";
import 'react-toastify/dist/ReactToastify.css';
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

function Main() {
  // const dispatch = useDispatch();
  const { open } = useWeb3Modal();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [mycode, updateCode] = useState(`# Input from smart contract would be loaded into the INPUT variable (bytes32 presented as string)
# Write your code using INPUT variable(or not using it).
# To output result back to your smart-contract use print statement. It would be converted to bytes32 inside your contract.
print(31**int(INPUT))
`);
  const [ipfs_hash, updateIPFS] = useState(false);
  async function upload() {
    const response = await axios(process.env.REACT_APP_URL + `/api/create`, {
			method: "POST",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({ 
        code: mycode
      })
		});
    updateIPFS(response.data.ipfs_hash)
  }
  return (
    <>
        { 
          address !== undefined ? 
          <>
            <h2>Connected address: {address}</h2>
            <button 
                className="disconnect"
                onClick={
                    () => {
                        disconnect()
                    }
                }
            >
              Disconnect
            </button>
            <h3>Input your task's code here:</h3>
            <AceEditor
              placeholder=""
              mode="python"
              theme="github"
              name="icode"
              onChange={updateCode}
              fontSize={14}
              lineHeight={19}
              showPrintMargin={true}
              showGutter={true}
              highlightActiveLine={true}
              value={mycode}
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: false,
                showLineNumbers: true,
                tabSize: 4,
                wrap: true,
              }}
            />
            <button 
                className="upload"
                onClick={
                    () => {
                        upload()
                    }
                }
            >
              Upload to IPFS
            </button>
            { ipfs_hash ?
              <>
                <p>
                  Your code has been uploaded with IPFS hash to pinata IPFS: {ipfs_hash}.
                  Now you can 
                </p>
              </>
            :
            <>
              <p>
                Upload your code first.
              </p>
            </>
            }
          </>
          :
          <>
            <button 
                className="connect"
                onClick={
                    () => {
                        open()
                    }
                }
            >
              Connect with WalletConnect
            </button>
          </>
        }
    </>
  );
}

export default Main;