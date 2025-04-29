import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchEvents,
  fetchUserEvents,
  fetchEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../../api/events';
import type { EventFormData } from '../../api/events';
import type { FrontendEvent, EventCategory } from '../../types/event';

interface EventsState {
  items: FrontendEvent[];
  userItems: FrontendEvent[];
  isLoading: boolean;
  isLoadingUserEvents: boolean;
  error: string | null;
  userEventsError: string | null;
  filterCategory: EventCategory | null;
  editableEvent: FrontendEvent | null;
  isLoadingEditable: boolean;
  errorEditable: string | null;
  isSubmitting: boolean;
  submittingError: string | null;
}

const initialState: EventsState = {
  items: [],
  userItems: [],
  isLoading: false,
  isLoadingUserEvents: false,
  error: null,
  userEventsError: null,
  filterCategory: null,
  editableEvent: null,
  isLoadingEditable: false,
  errorEditable: null,
  isSubmitting: false,
  submittingError: null,
};

export const fetchEventsThunk = createAsyncThunk<
  FrontendEvent[],
  EventCategory | null | undefined,
  { rejectValue: string }
>(
  'events/fetchEvents',
  async (category, { rejectWithValue }) => {
    try {
      const response = await fetchEvents(category);
      return response;
    } catch (error: unknown) {
       if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Произошла неизвестная ошибка при загрузке событий');
    }
  }
);

export const fetchUserEventsThunk = createAsyncThunk<
  FrontendEvent[],
  void,
  { rejectValue: string }
>(
  'events/fetchUserEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchUserEvents();
      return response;
    } catch (error: unknown) {
       if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('Произошла неизвестная ошибка при загрузке ваших событий');
    }
  }
);

export const fetchEventByIdThunk = createAsyncThunk<
  FrontendEvent,
  string | number,
  { rejectValue: string }
>(
  'events/fetchById',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await fetchEventById(eventId);
      return response;
    } catch (error: unknown) {
      if (error instanceof Error) {
          return rejectWithValue(error.message);
      }
      return rejectWithValue('Неизвестная ошибка при загрузке деталей события');
     }
  }
);

export const createEventThunk = createAsyncThunk<
  FrontendEvent,
  EventFormData,
  { rejectValue: string }
>(
  'events/create',
  async (eventData, { rejectWithValue }) => {
    try {
      const response = await createEvent(eventData);
      return response;
    } catch (error: unknown) {
       if (error instanceof Error) {
           return rejectWithValue(error.message);
       }
       return rejectWithValue('Неизвестная ошибка при создании события');
      }
  }
);

export const updateEventThunk = createAsyncThunk<
  FrontendEvent,
  { id: string | number; eventData: Partial<EventFormData> },
  { rejectValue: string }
>(
  'events/update',
  async ({ id, eventData }, { rejectWithValue }) => {
    try {
      const response = await updateEvent(id, eventData);
      return response;
    } catch (error: unknown) {
       if (error instanceof Error) {
           return rejectWithValue(error.message);
       }
       return rejectWithValue('Неизвестная ошибка при обновлении события');
      }
  }
);

export const deleteEventThunk = createAsyncThunk<
  string | number,
  string | number,
  { rejectValue: string }
>(
  'events/delete',
  async (eventId, { rejectWithValue }) => {
    try {
      await deleteEvent(eventId);
      return eventId;
    } catch (error: unknown) {
       if (error instanceof Error) {
           return rejectWithValue(error.message);
       }
       return rejectWithValue('Неизвестная ошибка при удалении события');
      }
  }
);


const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setFilterCategory: (state, action: PayloadAction<EventCategory | null>) => {
      state.filterCategory = action.payload;
    },
    clearEventsError: (state) => { state.error = null; },
    clearUserEventsError: (state) => { state.userEventsError = null; },
    clearEditableEvent: (state) => {
        state.editableEvent = null;
        state.isLoadingEditable = false;
        state.errorEditable = null;
    },
    clearSubmittingError: (state) => {
        state.submittingError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEventsThunk.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchEventsThunk.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload; })
      .addCase(fetchEventsThunk.rejected, (state, action) => { state.isLoading = false; state.items = []; state.error = action.payload ?? 'Error'; })

      .addCase(fetchUserEventsThunk.pending, (state) => { state.isLoadingUserEvents = true; state.userEventsError = null; })
      .addCase(fetchUserEventsThunk.fulfilled, (state, action) => { state.isLoadingUserEvents = false; state.userItems = action.payload; })
      .addCase(fetchUserEventsThunk.rejected, (state, action) => { state.isLoadingUserEvents = false; state.userItems = []; state.userEventsError = action.payload ?? 'Error'; })

      .addCase(fetchEventByIdThunk.pending, (state) => { state.isLoadingEditable = true; state.errorEditable = null; state.editableEvent = null; })
      .addCase(fetchEventByIdThunk.fulfilled, (state, action) => { state.isLoadingEditable = false; state.editableEvent = action.payload; })
      .addCase(fetchEventByIdThunk.rejected, (state, action) => { state.isLoadingEditable = false; state.errorEditable = action.payload ?? 'Error loading event details'; })

      .addCase(createEventThunk.pending, (state) => { state.isSubmitting = true; state.submittingError = null; })
      .addCase(createEventThunk.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(createEventThunk.rejected, (state, action) => { state.isSubmitting = false; state.submittingError = action.payload ?? 'Error creating event'; })

      .addCase(updateEventThunk.pending, (state) => { state.isSubmitting = true; state.submittingError = null; })
      .addCase(updateEventThunk.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.editableEvent = null;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        const userIndex = state.userItems.findIndex(item => item.id === action.payload.id);
        if (userIndex !== -1) state.userItems[userIndex] = action.payload;
      })
      .addCase(updateEventThunk.rejected, (state, action) => { state.isSubmitting = false; state.submittingError = action.payload ?? 'Error updating event'; })

      .addCase(deleteEventThunk.pending, (state) => { state.isSubmitting = true; state.submittingError = null; })
      .addCase(deleteEventThunk.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.items = state.items.filter(item => item.id !== action.payload);
        state.userItems = state.userItems.filter(item => item.id !== action.payload);
      })
      .addCase(deleteEventThunk.rejected, (state, action) => { state.isSubmitting = false; state.submittingError = action.payload ?? 'Error deleting event'; });
  },
});

export const {
  setFilterCategory,
  clearEventsError,
  clearUserEventsError,
  clearEditableEvent,
  clearSubmittingError
} = eventsSlice.actions;

export default eventsSlice.reducer;