import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Interfaz de Pokémon", () => {

  it("debe contener los elementos principales de la interfaz", () => {

    const htmlPath = path.resolve(
      process.cwd(),
      "index.html"
    );

    const html = fs.readFileSync(
      htmlPath,
      "utf-8"
    );

    document.body.innerHTML = html;

    expect(
      document.querySelector("#search")
    ).not.toBeNull();

    expect(
      document.querySelector("#typeFilter")
    ).not.toBeNull();

    expect(
      document.querySelector("#searchButton")
    ).not.toBeNull();

    expect(
      document.querySelector("#results")
    ).not.toBeNull();

    expect(
      document.querySelector("#pagination")
    ).not.toBeNull();

    expect(
      document.querySelector("#details")
    ).not.toBeNull();

    expect(
      document.querySelector("#collections")
    ).not.toBeNull();

  });

});