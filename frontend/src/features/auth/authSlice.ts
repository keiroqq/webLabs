import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { loginUser, registerUser, logoutUser } from '../../api/auth';
import type { FrontendUser, LoginResponse } from '../../types/user';
import {
  saveToken,
  saveUserInfo,
  removeToken,
  removeUserInfo,
  getToken,
  getUserInfo,
} from '../../utils/storage';

interface AuthState {
  user: FrontendUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: getUserInfo(),
  isAuthenticated: !!getToken(),
  isLoading: false,
  error: null,
};

export const loginUserThunk = createAsyncThunk<
  FrontendUser,
  Parameters<typeof loginUser>[0],
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response: LoginResponse = await loginUser(credentials);
    saveToken(response.token);
    saveUserInfo(response.user);
    return response.user;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Произошла неизвестная ошибка при входе');
  }
});

export const registerUserThunk = createAsyncThunk<
  { message: string },
  Parameters<typeof registerUser>[0],
  { rejectValue: string }
>('auth/register', async (credentials, { rejectWithValue }) => {
  try {
    const response = await registerUser(credentials);
    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }
    return rejectWithValue('Произошла неизвестная ошибка при регистрации');
  }
});

export const logoutUserThunk = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>('auth/logout', async (_, { rejectWithValue }) => {
  const token = getToken();
  if (!token) {
    console.warn('Logout attempt without token. Clearing local data.');
    removeToken();
    removeUserInfo();
    return;
  }
  try {
    await logoutUser(token);
    removeToken();
    removeUserInfo();
    console.log('Logout API successful. Local storage cleared.');
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message !== 'Сессия истекла или недействительна.') {
        return rejectWithValue(error.message);
      }
      console.log('Logout Thunk caught 401 from interceptor, completing.');
    } else {
      return rejectWithValue('Неизвестная ошибка при выходе на сервере.');
    }
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      console.log('Auth state cleared by logout reducer');
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUserThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        loginUserThunk.fulfilled,
        (state, action: PayloadAction<FrontendUser>) => {
          state.isLoading = false;
          state.isAuthenticated = true;
          state.user = action.payload;
          state.error = null;
        },
      )
      .addCase(loginUserThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload ?? 'Ошибка входа';
      })
      .addCase(registerUserThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUserThunk.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerUserThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Ошибка регистрации';
      })
      .addCase(logoutUserThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUserThunk.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        console.log('Auth state cleared after logout thunk fulfilled');
      })
      .addCase(logoutUserThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Ошибка выхода';
        console.error('Logout thunk rejected with error:', action.payload);
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

export default authSlice.reducer;
