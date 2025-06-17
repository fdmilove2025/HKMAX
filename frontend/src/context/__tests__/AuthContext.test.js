import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../AuthContext";

// Test component that uses the auth context
const TestComponent = () => {
  const { currentUser, login, logout, error, register } = useAuth();
  return (
    <div>
      <div data-testid="user">
        {currentUser ? JSON.stringify(currentUser) : "No user"}
      </div>
      <div data-testid="error">{error}</div>
      <button onClick={() => login("test@example.com", "password")}>
        Login
      </button>
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

// Wrapper component for testing hooks
const HookWrapper = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

describe("AuthContext", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
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

    // Mock successful login response
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

    // Click login button
    await userEvent.click(screen.getByText("Login"));

    // Verify localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith("authToken", mockToken);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "user",
      JSON.stringify(mockUser)
    );

    // Verify user state was updated
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent(
        JSON.stringify(mockUser)
      );
    });
  });

  it("should handle login failure", async () => {
    // Mock failed login response
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

    // Click login button
    await userEvent.click(screen.getByText("Login"));

    // Verify error state was updated
    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Invalid credentials"
      );
    });
  });

  it("should handle logout", async () => {
    // Set up initial logged in state
    const mockUser = { id: 1, email: "test@example.com", username: "testuser" };
    localStorage.setItem("user", JSON.stringify(mockUser));
    localStorage.setItem("authToken", "mock-token");

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click logout button
    await userEvent.click(screen.getByText("Logout"));

    // Verify localStorage was cleared
    expect(localStorage.removeItem).toHaveBeenCalledWith("authToken");
    expect(localStorage.removeItem).toHaveBeenCalledWith("user");

    // Verify user state was cleared
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

    // Mock successful registration response
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

    // Click register button
    await userEvent.click(screen.getByText("Register"));

    // Verify localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith("authToken", mockToken);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "user",
      JSON.stringify(mockUser)
    );

    // Verify user state was updated
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent(
        JSON.stringify(mockUser)
      );
    });
  });

  it("should handle registration failure", async () => {
    // Mock failed registration response
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

    // Click register button
    await userEvent.click(screen.getByText("Register"));

    // Verify error state was updated
    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Email already exists"
      );
    });
  });
});
