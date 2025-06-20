import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../AuthContext";

// Test component that uses the auth context
const TestComponent = () => {
  const { currentUser, login, logout, error, register } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login("test@example.com", "password");
    } catch (err) {
      // Error is already set in the context
    }
  };

  return (
    <div>
      <div data-testid="user">
        {currentUser ? JSON.stringify(currentUser) : "No user"}
      </div>
      <div data-testid="error">{error}</div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={logout}>Logout</button>
      <button
        onClick={() =>
          register("newuser@example.com", "newuser", "password123", 25)
        }
      >
        Register
      </button>
    </div>
  );
};

describe("AuthContext", () => {
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
  });

  it("should provide auth context to children", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user")).toHaveTextContent("No user");
  });

  it("should handle login successfully", async () => {
    const mockUser = { id: 1, email: "test@example.com", username: "testuser" };
    const mockToken = "mock-token";

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ access_token: mockToken, user: mockUser }),
      })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      await userEvent.click(screen.getByText("Login"));
    });

    // Only token should be stored in localStorage
    expect(localStorageSpy.setItem).toHaveBeenCalledWith("token", mockToken);
    expect(localStorageSpy.setItem).not.toHaveBeenCalledWith(
      "user",
      JSON.stringify(mockUser)
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent(
        JSON.stringify(mockUser)
      );
    });
  });

  it("should handle login failure", async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Invalid credentials" }),
      })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      await userEvent.click(screen.getByText("Login"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Invalid credentials"
      );
    });
  });

  it("should handle logout", async () => {
    const mockUser = { id: 1, email: "test@example.com", username: "testuser" };
    localStorageSpy.getItem.mockImplementation((key) => {
      if (key === "user") return JSON.stringify(mockUser);
      if (key === "token") return "mock-token";
      return null;
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      await userEvent.click(screen.getByText("Logout"));
    });

    expect(localStorageSpy.removeItem).toHaveBeenCalledWith("token");
    expect(localStorageSpy.removeItem).toHaveBeenCalledWith("user");

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("No user");
    });
  });

  it("should handle successful registration", async () => {
    const mockUser = {
      id: 1,
      email: "newuser@example.com",
      username: "newuser",
    };
    const mockToken = "mock-token";

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ access_token: mockToken, user: mockUser }),
      })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      await userEvent.click(screen.getByText("Register"));
    });

    // Only token should be stored in localStorage
    expect(localStorageSpy.setItem).toHaveBeenCalledWith("token", mockToken);
    expect(localStorageSpy.setItem).not.toHaveBeenCalledWith(
      "user",
      JSON.stringify(mockUser)
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent(
        JSON.stringify(mockUser)
      );
    });
  });

  it("should handle registration failure", async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Email already exists" }),
      })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      await userEvent.click(screen.getByText("Register"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Email already exists"
      );
    });
  });
});
