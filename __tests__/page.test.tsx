import {render, screen} from "@testing-library/react";
import Home from "@/app/page";

// Mock next/font/google used in layout (not needed here since we test just the page component)
jest.mock("next/image", () => ({
    __esModule: true,
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img {...props} />;
    },
}));

describe("Home page", () => {
    it("renders LibraryApp with Bibliotheca in the sidebar", () => {
        render(<Home/>);
        expect(screen.getByText("Bibliotheca")).toBeInTheDocument();
    });

    it("renders the dashboard page by default", () => {
        render(<Home/>);
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    });
});
