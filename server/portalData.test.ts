import { describe, expect, it } from "vitest";
import { parseAttendanceCsv, sortByIsoDate, summarizeAttendance } from "../shared/portalData";

describe("portal live data helpers", () => {
  it("summarizes present, late, absent, and percentage values", () => {
    expect(summarizeAttendance([
      { status: "present" },
      { status: "present" },
      { status: "late" },
      { status: "absent" },
    ])).toEqual({ present: 2, late: 1, absent: 1, total: 4, percentage: 50 });
  });

  it("returns a safe zero summary for an empty attendance list", () => {
    expect(summarizeAttendance([])).toEqual({ present: 0, late: 0, absent: 0, total: 0, percentage: 0 });
  });

  it("sorts schedule records by ISO date without mutating the source", () => {
    const source = [{ sessionDate: "2026-10-24" }, { sessionDate: "2026-10-03" }];
    expect(sortByIsoDate(source).map(record => record.sessionDate)).toEqual(["2026-10-03", "2026-10-24"]);
    expect(source[0]?.sessionDate).toBe("2026-10-24");
  });

  it("parses valid attendance CSV rows and defaults the student email", () => {
    expect(parseAttendanceCsv("date,status,email\n2026-09-12,present,\n2026-09-13,late,parent@example.com\nnot-a-date,unknown,", "student@example.com")).toEqual([
      { studentEmail: "student@example.com", attendanceDate: "2026-09-12", status: "present" },
      { studentEmail: "parent@example.com", attendanceDate: "2026-09-13", status: "late" },
    ]);
  });
});
