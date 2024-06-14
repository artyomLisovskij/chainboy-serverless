import { combineReducers, configureStore } from '@reduxjs/toolkit'
import base from '../base/base'

const rootReducer = combineReducers({
	base
})

export const store = configureStore({
	reducer: rootReducer,
	middleware: (getDefaultMiddleware) => getDefaultMiddleware({
		serializableCheck: false,
	  })
})
