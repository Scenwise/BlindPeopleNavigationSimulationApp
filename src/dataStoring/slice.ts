import { createSlice } from '@reduxjs/toolkit';


export interface State {
    mapStyle: string; // The id of the current map style
}

export const initialState: State = {
    mapStyle: 'streets-v12'
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