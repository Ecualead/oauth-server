/**
 * Copyright (C) 2020-2022 ECUALEAD
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <rmillo@ecualead.com>
 *
 * This file is part of the ECUALEAD OAuth2 Server API.
 * It can't be copied and/or distributed without the express
 * permission of the author.
 */
import "mocha";
import chai from "chai";
const expect = chai.expect;

describe("Stub module unit test", () => {
  it("Stub test", (done) => {
    expect("hello").to.be.a("string").to.have.length(5);
    done();
  }).timeout(1000);
});
