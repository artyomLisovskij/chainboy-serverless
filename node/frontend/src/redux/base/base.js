import { createSlice } from '@reduxjs/toolkit'

const base = createSlice({
	name: 'base',
	initialState: {
		task_txid: '',
		request_id: ''
	},
	reducers: {
		setTaskTxid(state, action) {
			state.task_txid = action.payload
		},
		setRequestId(state, action) {
			state.request_id = action.payload
		},
	}
})

export default base.reducer

export const { 
	setTaskTxid,
	setRequestId
} = base.actions
