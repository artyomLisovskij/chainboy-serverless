import React from 'react';
// import {useEffect} from 'react';
import { Route, Routes } from 'react-router-dom'
import './App.css';
import Main from './routes/main/main';
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={<Main />} />
      </Routes>
      <ToastContainer/>
    </div>
  );
}

export default App;
