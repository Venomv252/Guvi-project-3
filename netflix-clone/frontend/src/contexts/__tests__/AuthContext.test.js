import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import authService from '../../services/authService';

// Mock authService
jest.mock('../../services/authService');
const mockedAuthService = authService;

// Test component to access auth context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, logout, error } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'No error'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    mockedAuthService.isAuthenticated.mockReturnValue(false);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
  });

  it('should set authenticated user when valid token exists', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    
    mockedAuthService.isAuthenticated.mockReturnValue(true);
    mockedAuthService.getCurrentUser.mockReturnValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
  });

  it('should handle login successfully', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    const mockLoginResult = { user: mockUser, accessToken: 'token' };

    mockedAuthService.isAuthenticated.mockReturnValue(false);
    mockedAuthService.login.mockResolvedValue(mockLoginResult);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Click login button
    act(() => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    expect(mockedAuthService.login).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should handle login failure', async () => {
    const mockError = new Error('Invalid credentials');
    
    mockedAuthService.isAuthenticated.mockReturnValue(false);
    mockedAuthService.login.mockRejectedValue(mockError);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    // Click login button
    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  it('should handle logout', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    
    mockedAuthService.isAuthenticated.mockReturnValue(true);
    mockedAuthService.getCurrentUser.mockReturnValue(mockUser);
    mockedAuthService.logout.mockResolvedValue();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading and user to be set
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    // Click logout button
    act(() => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });

    expect(mockedAuthService.logout).toHaveBeenCalled();
  });

  it('should handle logout when service fails', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    
    mockedAuthService.isAuthenticated.mockReturnValue(true);
    mockedAuthService.getCurrentUser.mockReturnValue(mockUser);
    mockedAuthService.logout.mockRejectedValue(new Error('Network error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading and user to be set
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    // Click logout button
    act(() => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  it('should logout when token exists but user is invalid', async () => {
    mockedAuthService.isAuthenticated.mockReturnValue(true);
    mockedAuthService.getCurrentUser.mockReturnValue(null);
    mockedAuthService.logout.mockResolvedValue();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(mockedAuthService.logout).toHaveBeenCalled();
  });

  it('should throw error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});