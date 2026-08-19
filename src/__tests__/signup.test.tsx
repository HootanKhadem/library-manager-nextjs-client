import {act, fireEvent, render, screen} from "@testing-library/react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/src/contexts/AuthContext";
import SignupPage from "@/src/app/signup/page";

jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

jest.mock("@/src/contexts/AuthContext", () => ({
    useAuth: jest.fn(),
}));

const mockReplace = jest.fn();
const mockPush = jest.fn();

type AuthState = {
    isAuthenticated?: boolean;
    hydrated?: boolean;
    signup?: jest.Mock;
};

function setupAuth(overrides: AuthState = {}) {
    (useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        hydrated: true,
        signup: jest.fn().mockResolvedValue({ok: true}),
        ...overrides,
    });
    (useRouter as jest.Mock).mockReturnValue({replace: mockReplace, push: mockPush});
}

async function fillValidForm() {
    fireEvent.change(screen.getByLabelText(/^name$/i), {target: {value: "Ada Lovelace"}});
    fireEvent.change(screen.getByLabelText(/email address/i), {target: {value: "ada@example.com"}});
    fireEvent.change(screen.getByLabelText(/^password$/i), {target: {value: "Passw0rd"}});
    fireEvent.change(screen.getByLabelText(/confirm password/i), {target: {value: "Passw0rd"}});
}

async function submitForm() {
    await fillValidForm();
    await act(async () => {
        fireEvent.click(screen.getByRole("button", {name: /create account/i}));
    });
}

describe("SignupPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setupAuth();
    });

    // ── Rendering ────────────────────────────────────────────────────────────

    it("returns null while not yet hydrated", () => {
        setupAuth({hydrated: false});
        const {container} = render(<SignupPage/>);
        expect(container.firstChild).toBeNull();
    });

    it("returns null and redirects to /dashboard when already authenticated", () => {
        setupAuth({isAuthenticated: true, hydrated: true});
        const {container} = render(<SignupPage/>);
        expect(container.firstChild).toBeNull();
        expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });

    it("renders the page when unauthenticated and hydrated", () => {
        render(<SignupPage/>);
        expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("renders the form header", () => {
        render(<SignupPage/>);
        expect(screen.getByRole("heading", {name: /create.*account/i})).toBeInTheDocument();
    });

    it("renders name, email, password, and confirm password fields", () => {
        render(<SignupPage/>);
        expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it("does not render a Google OAuth button", () => {
        render(<SignupPage/>);
        expect(screen.queryByRole("button", {name: /continue with google/i})).not.toBeInTheDocument();
    });

    it("renders the sign-in footer link back to /login", () => {
        render(<SignupPage/>);
        expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: /^sign in$/i})).toBeInTheDocument();
    });

    it("navigates to /login when the footer sign-in button is clicked", () => {
        render(<SignupPage/>);
        fireEvent.click(screen.getByRole("button", {name: /^sign in$/i}));
        expect(mockPush).toHaveBeenCalledWith("/login");
    });

    // ── Password requirements checklist ─────────────────────────────────────

    it("shows all three password requirements as unmet initially", () => {
        render(<SignupPage/>);
        expect(screen.getByTestId("pw-req-length")).toHaveAttribute("data-met", "false");
        expect(screen.getByTestId("pw-req-uppercase")).toHaveAttribute("data-met", "false");
        expect(screen.getByTestId("pw-req-digit")).toHaveAttribute("data-met", "false");
    });

    it("marks requirements as met as the password satisfies them", () => {
        render(<SignupPage/>);
        fireEvent.change(screen.getByLabelText(/^password$/i), {target: {value: "Passw0rd"}});
        expect(screen.getByTestId("pw-req-length")).toHaveAttribute("data-met", "true");
        expect(screen.getByTestId("pw-req-uppercase")).toHaveAttribute("data-met", "true");
        expect(screen.getByTestId("pw-req-digit")).toHaveAttribute("data-met", "true");
    });

    it("marks the digit requirement as unmet when the password has no digit", () => {
        render(<SignupPage/>);
        fireEvent.change(screen.getByLabelText(/^password$/i), {target: {value: "Password"}});
        expect(screen.getByTestId("pw-req-digit")).toHaveAttribute("data-met", "false");
    });

    // ── Validation ───────────────────────────────────────────────────────────

    it("shows an error when submitted with fields empty", () => {
        render(<SignupPage/>);
        fireEvent.click(screen.getByRole("button", {name: /create account/i}));
        expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument();
    });

    it("shows an error when the password does not meet the requirements", () => {
        render(<SignupPage/>);
        fireEvent.change(screen.getByLabelText(/^name$/i), {target: {value: "Ada"}});
        fireEvent.change(screen.getByLabelText(/email address/i), {target: {value: "ada@example.com"}});
        fireEvent.change(screen.getByLabelText(/^password$/i), {target: {value: "weak"}});
        fireEvent.change(screen.getByLabelText(/confirm password/i), {target: {value: "weak"}});
        fireEvent.click(screen.getByRole("button", {name: /create account/i}));
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });

    it("shows an error when the passwords do not match", () => {
        render(<SignupPage/>);
        fireEvent.change(screen.getByLabelText(/^name$/i), {target: {value: "Ada"}});
        fireEvent.change(screen.getByLabelText(/email address/i), {target: {value: "ada@example.com"}});
        fireEvent.change(screen.getByLabelText(/^password$/i), {target: {value: "Passw0rd"}});
        fireEvent.change(screen.getByLabelText(/confirm password/i), {target: {value: "Different1"}});
        fireEvent.click(screen.getByRole("button", {name: /create account/i}));
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it("does not call signup() when validation fails", () => {
        const mockSignup = jest.fn();
        setupAuth({signup: mockSignup});
        render(<SignupPage/>);
        fireEvent.click(screen.getByRole("button", {name: /create account/i}));
        expect(mockSignup).not.toHaveBeenCalled();
    });

    // ── Loading state ────────────────────────────────────────────────────────

    it("shows 'Creating account…' and disables the button while the request is in flight", async () => {
        setupAuth({
            signup: jest.fn().mockReturnValue(new Promise(() => {
            }))
        });
        render(<SignupPage/>);
        await fillValidForm();
        fireEvent.click(screen.getByRole("button", {name: /create account/i}));

        const btn = await screen.findByRole("button", {name: /creating account/i});
        expect(btn).toBeDisabled();
    });

    // ── Successful signup ────────────────────────────────────────────────────

    it("calls signup() with name, email, and password", async () => {
        const mockSignup = jest.fn().mockResolvedValue({ok: true});
        setupAuth({signup: mockSignup});
        render(<SignupPage/>);
        await submitForm();
        expect(mockSignup).toHaveBeenCalledWith("Ada Lovelace", "ada@example.com", "Passw0rd");
    });

    it("redirects to /dashboard after a successful signup", async () => {
        render(<SignupPage/>);
        await submitForm();
        expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });

    // ── Failed signup ─────────────────────────────────────────────────────────

    it("shows the backend's error message and re-enables the button on failure", async () => {
        setupAuth({signup: jest.fn().mockResolvedValue({ok: false, message: "Email already registered."})});
        render(<SignupPage/>);
        await submitForm();
        expect(screen.getByText("Email already registered.")).toBeInTheDocument();
        expect(screen.getByRole("button", {name: /create account/i})).not.toBeDisabled();
    });

    it("shows a generic error when signup() throws", async () => {
        setupAuth({signup: jest.fn().mockRejectedValue(new Error("network error"))});
        render(<SignupPage/>);
        await submitForm();
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
});
