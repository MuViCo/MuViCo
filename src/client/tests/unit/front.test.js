import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import FrontPage from "../../components/frontpage/index";

describe("FrontPage", () => {
  test("renders the application description", () => {
    const { getByText } = render(<FrontPage />);
    const descriptionElement = getByText(
      "MuviCo is a multimodal application designed to provide versatile visual elements and support functions for live music performances.The purpose of the application is to bring an additional dimension to music experiences that can complement and enrich the experience for both listeners and performers.The program is browser-based and intended to operate on computers. The application displays lyrics, images, or AI-generated visuals to enhance the musical experience. Additionally, it reflects the lyrics to support the singer. All performances can be pre-planned or guided in real-time."
    );
    expect(descriptionElement).toBeInTheDocument();
  });
});
