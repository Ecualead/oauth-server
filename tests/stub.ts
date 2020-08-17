/**
 * Copyright (C) 2020 IKOA Business Opportunity
 * All Rights Reserved
 * Author: Reinier Millo Sánchez <millo@ikoabo.com>
 *
 * This file is part of the IKOA Business Opportunity
 * Identity Management Service.
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
