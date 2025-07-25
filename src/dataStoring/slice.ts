import { PayloadAction, createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';


export interface State {
    mapStyle: string; // The id of the current map style
}

export const initialState: State = {
    mapStyle: 'light-v11'
};

const slice = createSlice({
    name: 'slice',
    initialState: initialState,
    reducers: {
    },
});

export const {
    
} = slice.actions;


export { slice };