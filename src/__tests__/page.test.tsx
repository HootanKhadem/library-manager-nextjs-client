import {redirect} from "next/navigation";
import Home from "@/src/app/page";

jest.mock("next/navigation", () => ({
    redirect: jest.fn(),
}));

describe("Home page", () => {
    it("redirects to /dashboard", () => {
        Home();
        expect(redirect).toHaveBeenCalledWith("/dashboard");
    });
});
