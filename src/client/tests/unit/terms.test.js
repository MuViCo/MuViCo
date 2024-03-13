import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import TermsPage from "../../components/termspage/index";

describe("TermsPage", () => {
  test("renders the Terms of Service heading", () => {
    const { getByText } = render(<TermsPage />);
    const headingElement = getByText("Terms of Service");
    expect(headingElement).toBeInTheDocument();
  });

  test("renders the User Registration section", () => {
    const { getByText } = render(<TermsPage />);
    const userRegistrationElement = getByText("User Registration:");
    expect(userRegistrationElement).toBeInTheDocument();
  });
});
