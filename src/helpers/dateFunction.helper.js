import moment from "moment";

// get current timestamp
export const setCurrentTimestamp = function () {
  return Number(moment().format("x"));
};
