import {render, screen} from "@testing-library/react";
import {MarketingHeader} from "@/src/app/(marketing)/_components/MarketingHeader";

describe("MarketingHeader", () => {
    it("renders a Sign in link to /login", () => {
        render(<MarketingHeader/>);
        expect(screen.getByRole("link", {name: /^sign in$/i})).toHaveAttribute("href", "/login");
    });

    it("renders a Sign up link to /signup", () => {
        render(<MarketingHeader/>);
        expect(screen.getByRole("link", {name: /^sign up$/i})).toHaveAttribute("href", "/signup");
    });
});
