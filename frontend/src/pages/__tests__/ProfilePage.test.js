import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../context/AuthContext";
import ProfilePage from "../ProfilePage";

// Mock the useTheme hook
jest.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({
    isDarkMode: false,
    toggleTheme: jest.fn(),
  }),
}));

// Mock the AuthContext
const mockAuthContext = {
  currentUser: {
    id: 1,
    username: "testuser",
    email: "test@example.com",
    is_two_factor_enabled: false,
  },
  getAuthHeaders: jest.fn(() => ({ Authorization: "Bearer mock-token" })),
  makeAuthenticatedRequest: jest.fn(),
  updateCurrentUser: jest.fn(),
};

jest.mock("../../context/AuthContext", () => ({
  ...jest.requireActual("../../context/AuthContext"),
  useAuth: () => mockAuthContext,
}));

// Test wrapper with Router
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe("ProfilePage", () => {
  const mockUser = {
    id: 1,
    username: "testuser",
    email: "test@example.com",
    is_two_factor_enabled: false,
  };

  let localStorageSpy;

  beforeAll(() => {
    // Create a proper mock for localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    localStorageSpy = localStorageMock;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageSpy.clear();
    mockAuthContext.currentUser = { ...mockUser };
    mockAuthContext.makeAuthenticatedRequest.mockImplementation(() =>
      Promise.resolve({ user: mockUser })
    );
    mockAuthContext.updateCurrentUser.mockImplementation(() => {});
  });

  it("should render profile page with user data", async () => {
    render(
      <TestWrapper>
        <ProfilePage />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
      expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
    });
  });

  it("should handle profile update", async () => {
    mockAuthContext.makeAuthenticatedRequest.mockImplementationOnce(() =>
      Promise.resolve({ user: { ...mockUser, username: "newusername" } })
    );
    
    render(
      <TestWrapper>
        <ProfilePage />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
    });
    
    const usernameInput = screen.getByDisplayValue("testuser");
    await act(async () => {
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, "newusername");
    });
    
    const submitButton = screen.getByRole("button", {
      name: /save changes/i,
    });
    
    await act(async () => {
      await userEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(
        screen.getByText("Profile updated successfully!")
      ).toBeInTheDocument();
    });
  });

  it("should show 2FA enable button when 2FA is disabled", async () => {
    render(
      <TestWrapper>
        <ProfilePage />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
    });
    
    expect(screen.getByRole("button", { name: /enable 2fa/i })).toBeInTheDocument();
  });

  it("should show 2FA disable button when 2FA is enabled", async () => {
    mockAuthContext.currentUser = { ...mockUser, is_two_factor_enabled: true };
    
    render(
      <TestWrapper>
        <ProfilePage />
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
    });
    
    expect(screen.getByText(/two-factor authentication is currently enabled/i)).toBeInTheDocument();
  });
});
