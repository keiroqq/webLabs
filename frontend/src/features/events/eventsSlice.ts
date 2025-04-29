import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchEvents,
  fetchUserEvents,
  fetchEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  fetchEventParticipants,
} from '../../api/events';
import type { EventFormData } from '../../api/events';
import type {
  FrontendEvent,
  EventCategory,
  Participant,
} from '../../types/event';

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
  registeringEventId: number | null;
  isRegistering: boolean;
  registerError: string | null;
  participants: Participant[];
  isLoadingParticipants: boolean;
  participantsError: string | null;
  viewingParticipantsEventId: number | null;
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
  registeringEventId: null,
  isRegistering: false,
  registerError: null,
  participants: [],
  isLoadingParticipants: false,
  participantsError: null,
  viewingParticipantsEventId: null,
};

export const fetchEventsThunk = createAsyncThunk<
  FrontendEvent[],
  EventCategory | null | undefined,
  { rejectValue: string }
>('events/fetchEvents', async (category, { rejectWithValue }) => {
  try {
    const response = await fetchEvents(category);
    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Произошла неизвестная ошибка при загрузке событий');
  }
});

export const fetchUserEventsThunk = createAsyncThunk<
  FrontendEvent[],
  void,
  { rejectValue: string }
>('events/fetchUserEvents', async (_, { rejectWithValue }) => {
  try {
    const response = await fetchUserEvents();
    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue(
      'Произошла неизвестная ошибка при загрузке ваших событий',
    );
  }
});

export const fetchEventByIdThunk = createAsyncThunk<
  FrontendEvent,
  string | number,
  { rejectValue: string }
>('events/fetchById', async (eventId, { rejectWithValue }) => {
  try {
    const response = await fetchEventById(eventId);
    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Неизвестная ошибка при загрузке деталей события');
  }
});

export const createEventThunk = createAsyncThunk<
  FrontendEvent,
  EventFormData,
  { rejectValue: string }
>('events/create', async (eventData, { rejectWithValue }) => {
  try {
    const response = await createEvent(eventData);
    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Неизвестная ошибка при создании события');
  }
});

export const updateEventThunk = createAsyncThunk<
  FrontendEvent,
  { id: string | number; eventData: Partial<EventFormData> },
  { rejectValue: string }
>('events/update', async ({ id, eventData }, { rejectWithValue }) => {
  try {
    const response = await updateEvent(id, eventData);
    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Неизвестная ошибка при обновлении события');
  }
});

export const deleteEventThunk = createAsyncThunk<
  string | number,
  string | number,
  { rejectValue: string }
>('events/delete', async (eventId, { rejectWithValue }) => {
  try {
    await deleteEvent(eventId);
    return eventId;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Неизвестная ошибка при удалении события');
  }
});

// Регистрация на событие
export const registerForEventThunk = createAsyncThunk<
  FrontendEvent, // Возвращает обновленное событие
  number, // Принимает eventId
  { rejectValue: string }
>('events/registerForEvent', async (eventId, { rejectWithValue }) => {
  try {
    const updatedEvent = await registerForEvent(eventId);
    return updatedEvent;
  } catch (error: unknown) {
    if (error instanceof Error) return rejectWithValue(error.message);
    return rejectWithValue('Неизвестная ошибка при регистрации');
  }
});

// Отмена регистрации на событие
export const unregisterFromEventThunk = createAsyncThunk<
  FrontendEvent, // Возвращает обновленное событие
  number, // Принимает eventId
  { rejectValue: string }
>('events/unregisterFromEvent', async (eventId, { rejectWithValue }) => {
  try {
    const updatedEvent = await unregisterFromEvent(eventId);
    return updatedEvent;
  } catch (error: unknown) {
    if (error instanceof Error) return rejectWithValue(error.message);
    return rejectWithValue('Неизвестная ошибка при отмене регистрации');
  }
});

// (Опционально) Получение списка участников
export const fetchEventParticipantsThunk = createAsyncThunk<
  Participant[], // Возвращает список участников
  number, // Принимает eventId
  { rejectValue: string }
>('events/fetchParticipants', async (eventId, { rejectWithValue }) => {
  try {
    const participants = await fetchEventParticipants(eventId);
    return participants;
  } catch (error: unknown) {
    if (error instanceof Error) return rejectWithValue(error.message);
    return rejectWithValue('Неизвестная ошибка при загрузке участников');
  }
});

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setFilterCategory: (state, action: PayloadAction<EventCategory | null>) => {
      state.filterCategory = action.payload;
    },
    clearEventsError: (state) => {
      state.error = null;
    },
    clearUserEventsError: (state) => {
      state.userEventsError = null;
    },
    clearEditableEvent: (state) => {
      state.editableEvent = null;
      state.isLoadingEditable = false;
      state.errorEditable = null;
    },
    clearSubmittingError: (state) => {
      state.submittingError = null;
    },
    clearRegisterError: (state) => {
      state.registerError = null;
      state.registeringEventId = null;
    },
    clearParticipants: (state) => {
      state.participants = [];
      state.isLoadingParticipants = false;
      state.participantsError = null;
      state.viewingParticipantsEventId = null;
    },
    setViewingParticipantsEventId: (
      state,
      action: PayloadAction<number | null>,
    ) => {
      state.viewingParticipantsEventId = action.payload;
      state.participants = [];
      state.isLoadingParticipants = false;
      state.participantsError = null;
    },
  },
  extraReducers: (builder) => {
    const updateEventParticipation = (
      state: EventsState,
      updatedEvent: FrontendEvent,
    ) => {
      const updateList = (list: FrontendEvent[]) =>
        list.map((event) =>
          event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event,
        );
      state.items = updateList(state.items);
      state.userItems = updateList(state.userItems);
      if (state.editableEvent?.id === updatedEvent.id) {
        state.editableEvent = { ...state.editableEvent, ...updatedEvent };
      }
    };
    builder
      .addCase(fetchEventsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchEventsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.items = [];
        state.error = action.payload ?? 'Error';
      })
      .addCase(fetchUserEventsThunk.pending, (state) => {
        state.isLoadingUserEvents = true;
        state.userEventsError = null;
      })
      .addCase(fetchUserEventsThunk.fulfilled, (state, action) => {
        state.isLoadingUserEvents = false;
        state.userItems = action.payload;
      })
      .addCase(fetchUserEventsThunk.rejected, (state, action) => {
        state.isLoadingUserEvents = false;
        state.userItems = [];
        state.userEventsError = action.payload ?? 'Error';
      })
      .addCase(fetchEventByIdThunk.pending, (state) => {
        state.isLoadingEditable = true;
        state.errorEditable = null;
        state.editableEvent = null;
      })
      .addCase(fetchEventByIdThunk.fulfilled, (state, action) => {
        state.isLoadingEditable = false;
        state.editableEvent = action.payload;
      })
      .addCase(fetchEventByIdThunk.rejected, (state, action) => {
        state.isLoadingEditable = false;
        state.errorEditable = action.payload ?? 'Error loading event details';
      })
      .addCase(createEventThunk.pending, (state) => {
        state.isSubmitting = true;
        state.submittingError = null;
      })
      .addCase(createEventThunk.fulfilled, (state) => {
        state.isSubmitting = false;
      })
      .addCase(createEventThunk.rejected, (state, action) => {
        state.isSubmitting = false;
        state.submittingError = action.payload ?? 'Error creating event';
      })
      .addCase(updateEventThunk.pending, (state) => {
        state.isSubmitting = true;
        state.submittingError = null;
      })
      .addCase(updateEventThunk.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.editableEvent = null;
        updateEventParticipation(state, action.payload);
      })
      .addCase(updateEventThunk.rejected, (state, action) => {
        state.isSubmitting = false;
        state.submittingError = action.payload ?? 'Error updating event';
      })
      .addCase(deleteEventThunk.pending, (state) => {
        state.isSubmitting = true;
        state.submittingError = null;
      })
      .addCase(deleteEventThunk.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.userItems = state.userItems.filter(
          (item) => item.id !== action.payload,
        );
      })
      .addCase(deleteEventThunk.rejected, (state, action) => {
        state.isSubmitting = false;
        state.submittingError = action.payload ?? 'Error deleting event';
      })
      .addCase(registerForEventThunk.pending, (state, action) => {
        state.isRegistering = true;
        state.registeringEventId = action.meta.arg;
        state.registerError = null;
      })
      .addCase(
        registerForEventThunk.fulfilled,
        (state, action: PayloadAction<FrontendEvent>) => {
          state.isRegistering = false;
          state.registeringEventId = null;
          updateEventParticipation(state, action.payload);
        },
      )
      .addCase(registerForEventThunk.rejected, (state, action) => {
        state.isRegistering = false;
        state.registeringEventId = null;
        state.registerError = action.payload ?? 'Ошибка регистрации на событие';
      })
      .addCase(unregisterFromEventThunk.pending, (state, action) => {
        state.isRegistering = true;
        state.registeringEventId = action.meta.arg;
        state.registerError = null;
      })
      .addCase(
        unregisterFromEventThunk.fulfilled,
        (state, action: PayloadAction<FrontendEvent>) => {
          state.isRegistering = false;
          state.registeringEventId = null;
          updateEventParticipation(state, action.payload);
        },
      )
      .addCase(unregisterFromEventThunk.rejected, (state, action) => {
        state.isRegistering = false;
        state.registeringEventId = null;
        state.registerError = action.payload ?? 'Ошибка отмены регистрации';
      })
      .addCase(fetchEventParticipantsThunk.pending, (state) => {
        state.isLoadingParticipants = true;
        state.participantsError = null;
        state.participants = [];
      })
      .addCase(
        fetchEventParticipantsThunk.fulfilled,
        (state, action: PayloadAction<Participant[]>) => {
          state.isLoadingParticipants = false;
          state.participants = action.payload;
        },
      )
      .addCase(fetchEventParticipantsThunk.rejected, (state, action) => {
        state.isLoadingParticipants = false;
        state.participantsError =
          action.payload ?? 'Ошибка загрузки участников';
      });
  },
});

export const {
  setFilterCategory,
  clearEventsError,
  clearUserEventsError,
  clearEditableEvent,
  clearSubmittingError,
  clearRegisterError,
  clearParticipants,
  setViewingParticipantsEventId,
} = eventsSlice.actions;

export default eventsSlice.reducer;
