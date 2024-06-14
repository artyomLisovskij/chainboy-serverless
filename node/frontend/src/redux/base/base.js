import { createSlice } from '@reduxjs/toolkit'

const base = createSlice({
	name: 'base',
	initialState: {
		tasks: []
	},
	reducers: {
		setTasks(state, action) {
			state.tasks = action.payload
		},
	}
})

export default base.reducer

export const { 
	setTasks
} = base.actions
