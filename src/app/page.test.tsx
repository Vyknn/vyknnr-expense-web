import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renders the getting-started heading and the Next.js logo", () => {
    render(<Home />);

    expect(screen.getByText(/page\.tsx/i)).toBeInTheDocument();
    expect(screen.getByAltText("Next.js logo")).toBeInTheDocument();
  });
});
