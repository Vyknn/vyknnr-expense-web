import { render, screen } from "@testing-library/react";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import Home from "@/app/page";

describe("Home rendered inside AuthLayout", () => {
  it("composes the layout shell with the page content", () => {
    render(
      <AuthLayout>
        <Home />
      </AuthLayout>
    );

    expect(screen.getByText(/page\.tsx/i)).toBeInTheDocument();
    expect(screen.getByAltText("Next.js logo")).toBeInTheDocument();
  });
});
