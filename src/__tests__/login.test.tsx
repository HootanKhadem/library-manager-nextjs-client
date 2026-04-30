import {act, fireEvent, render, screen} from "@testing-library/react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/src/contexts/AuthContext";
import LoginPage from "@/src/app/login/page";

jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

jest.mock("@/src/contexts/AuthContext", () => ({
    useAuth: jest.fn(),
}));

const mockReplace = jest.fn();

type AuthState = {
    isAuthenticated?: boolean;
    hydrated?: boolean;
    login?: jest.Mock;
    logout?: jest.Mock;
};

function setupAuth(overrides: AuthState = {}) {
    (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        hydrated: true,
        login: jest.fn().mockResolvedValue(true),
        logout: jest.fn(),
        ...overrides,
    });
    (useRouter as jest.Mock).mockReturnValue({replace: mockReplace});
}

/** Fill both fields and click submit; wraps in act for async handleSubmit. */
async function submitForm(email = "a@b.com", password = "hunter2") {
    fireEvent.change(screen.getByLabelText(/email address/i), {target: {value: email}});
    fireEvent.change(screen.getByLabelText(/^password$/i), {target: {value: password}});
    await act(async () => {
        fireEvent.click(screen.getByRole("button", {name: /sign in/i}));
    });
}

describe("LoginPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupAuth();
    });

    // ── Rendering ────────────────────────────────────────────────────────────

    it("returns null while not yet hydrated", () => {
        setupAuth({hydrated: false});
        const {container} = render(<LoginPage/>);
        expect(container.firstChild).toBeNull();
    });

    it("returns null and redirects to /dashboard when already authenticated", () => {
        setupAuth({isAuthenticated: true, hydrated: true});
        const {container} = render(<LoginPage/>);
        expect(container.firstChild).toBeNull();
        expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });

    it("renders the page when unauthenticated and hydrated", () => {
        render(<LoginPage/>);
        expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("renders the Librax brand name in the left panel", () => {
        render(<LoginPage/>);
        expect(screen.getByText("Librax")).toBeInTheDocument();
    });

    it("renders the tagline copy", () => {
        render(<LoginPage/>);
        expect(screen.getByText(/reading universe/i)).toBeInTheDocument();
    });

    it("renders the three feature bullets", () => {
        render(<LoginPage/>);
        expect(screen.getByText(/Books/)).toBeInTheDocument();
        expect(screen.getByText(/Loans/)).toBeInTheDocument();
        expect(screen.getByText(/Authors/)).toBeInTheDocument();
    });

    it("renders the form header", () => {
        render(<LoginPage/>);
        expect(screen.getByRole("heading", {name: /welcome back/i})).toBeInTheDocument();
        expect(screen.getByText(/sign in to your library/i)).toBeInTheDocument();
    });

    it("renders email and password fields", () => {
        render(<LoginPage/>);
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    it("renders the remember me checkbox unchecked by default", () => {
        render(<LoginPage/>);
        expect(screen.getByLabelText(/remember me/i)).not.toBeChecked();
    });

    it("renders the forgot password link", () => {
        render(<LoginPage/>);
        expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it("renders the sign in submit button", () => {
        render(<LoginPage/>);
        expect(screen.getByRole("button", {name: /sign in/i})).toBeInTheDocument();
    });

    it("renders the Google OAuth button", () => {
        render(<LoginPage/>);
        expect(screen.getByRole("button", {name: /continue with google/i})).toBeInTheDocument();
    });

    it("renders the create account footer link", () => {
        render(<LoginPage/>);
        expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: /create one/i})).toBeInTheDocument();
    });

    // ── Password toggle ──────────────────────────────────────────────────────

    it("shows password as dots by default", () => {
        render(<LoginPage/>);
        expect(screen.getByLabelText(/^password$/i)).toHaveAttribute("type", "password");
    });

    it("reveals password when the toggle button is clicked", () => {
        render(<LoginPage/>);
        fireEvent.click(screen.getByRole("button", {name: /toggle password visibility/i}));
        expect(screen.getByLabelText(/^password$/i)).toHaveAttribute("type", "text");
    });

    it("hides password again on a second toggle click", () => {
        render(<LoginPage/>);
        const toggle = screen.getByRole("button", {name: /toggle password visibility/i});
        fireEvent.click(toggle);
        fireEvent.click(toggle);
        expect(screen.getByLabelText(/^password$/i)).toHaveAttribute("type", "password");
    });

    // ── Form validation ──────────────────────────────────────────────────────

    it("shows an error when submitted with both fields empty", () => {
        render(<LoginPage/>);
        fireEvent.click(screen.getByRole("button", {name: /sign in/i}));
        expect(screen.getByText(/please enter your email and password/i)).toBeInTheDocument();
    });

    it("shows an error when submitted with only the email filled", () => {
        render(<LoginPage/>);
        fireEvent.change(screen.getByLabelText(/email address/i), {target: {value: "a@b.com"}});
        fireEvent.click(screen.getByRole("button", {name: /sign in/i}));
        expect(screen.getByText(/please enter your email and password/i)).toBeInTheDocument();
    });

    it("shows an error when submitted with only the password filled", () => {
        render(<LoginPage/>);
        fireEvent.change(screen.getByLabelText(/^password$/i), {target: {value: "secret"}});
        fireEvent.click(screen.getByRole("button", {name: /sign in/i}));
        expect(screen.getByText(/please enter your email and password/i)).toBeInTheDocument();
    });

    it("does not call login() when validation fails", () => {
        const mockLogin = jest.fn();
        setupAuth({login: mockLogin});
        render(<LoginPage/>);
        fireEvent.click(screen.getByRole("button", {name: /sign in/i}));
        expect(mockLogin).not.toHaveBeenCalled();
    });

    // ── Loading state ────────────────────────────────────────────────────────

    it("shows 'Signing in…' and disables the button while the request is in flight", async () => {
        // A promise that never resolves keeps the component in the loading state
        setupAuth({
            login: jest.fn().mockReturnValue(new Promise(() => {
            }))
        });
        render(<LoginPage/>);
        fireEvent.change(screen.getByLabelText(/email address/i), {target: {value: "a@b.com"}});
        fireEvent.change(screen.getByLabelText(/^password$/i), {target: {value: "pass"}});
        fireEvent.click(screen.getByRole("button", {name: /sign in/i}));

        const btn = await screen.findByRole("button", {name: /signing in/i});
        expect(btn).toBeDisabled();
    });

    // ── Successful login ─────────────────────────────────────────────────────

    it("calls login() with email, password, and remember=false by default", async () => {
        const mockLogin = jest.fn().mockResolvedValue(true);
        setupAuth({login: mockLogin});
        render(<LoginPage/>);
        await submitForm("user@example.com", "hunter2");
        expect(mockLogin).toHaveBeenCalledWith("user@example.com", "hunter2", false);
    });

    it("calls login() with remember=true when checkbox is checked", async () => {
        const mockLogin = jest.fn().mockResolvedValue(true);
        setupAuth({login: mockLogin});
        render(<LoginPage/>);
        fireEvent.click(screen.getByLabelText(/remember me/i));
        await submitForm("a@b.com", "pass");
        expect(mockLogin).toHaveBeenCalledWith("a@b.com", "pass", true);
    });

    it("redirects to /dashboard after a successful login", async () => {
        render(<LoginPage/>);
        await submitForm();
        expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });

    // ── Failed login ─────────────────────────────────────────────────────────

    it("shows an error and re-enables the button when login() returns false", async () => {
        setupAuth({login: jest.fn().mockResolvedValue(false)});
        render(<LoginPage/>);
        await submitForm();
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: /sign in/i})).not.toBeDisabled();
    });

    it("shows a generic error when login() throws", async () => {
        setupAuth({login: jest.fn().mockRejectedValue(new Error("network error"))});
        render(<LoginPage/>);
        fireEvent.change(screen.getByLabelText(/email address/i), {target: {value: "a@b.com"}});
        fireEvent.change(screen.getByLabelText(/^password$/i), {target: {value: "pass"}});
        await act(async () => {
            fireEvent.click(screen.getByRole("button", {name: /sign in/i}));
        });
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it("clears a previous error when the user starts a new submission", async () => {
        setupAuth({login: jest.fn().mockResolvedValueOnce(false).mockResolvedValue(true)});
        render(<LoginPage/>);

        // First attempt — fails
        await submitForm();
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();

        // Second attempt — error clears immediately on submit
        fireEvent.click(screen.getByRole("button", {name: /sign in/i}));
        expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
    });

    // ── Remember me ──────────────────────────────────────────────────────────

    it("toggles the remember me checkbox on click", () => {
        render(<LoginPage/>);
        const checkbox = screen.getByLabelText(/remember me/i);
        expect(checkbox).not.toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
    });
});
