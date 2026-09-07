import { asc, count, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/mysql2"

import {
  assignments,
  assignmentSchedules,
  classGroups,
  courses,
  courseTypes,
  schedules,
  scheduleTeachers,
  shifts,
  spaces,
  spaceTypes,
  subjects,
  tasks,
  users,
} from "@/schemas"

/**
 * These run against the real drizzle dialect (no connection is opened) to make
 * sure the tables still map to the column and table names used by the legacy
 * Sequelize models.
 */
const db = drizzle.mock()

describe("table names", () => {
  it.each([
    [courses, "courses"],
    [courseTypes, "course_types"],
    [classGroups, "class_groups"],
    [shifts, "shifts"],
    [spaces, "spaces"],
    [spaceTypes, "space_types"],
    [subjects, "subjects"],
    [schedules, "schedules"],
    [scheduleTeachers, "schedule_teachers"],
    [assignments, "assignments"],
    [assignmentSchedules, "assignment_schedules"],
    [users, "users"],
    [tasks, "tasks"],
  ])("maps to %#", (table, name) => {
    expect(db.select().from(table).toSQL().sql).toContain(`from \`${name}\``)
  })
})

describe("timestamp columns", () => {
  it("keeps the Sequelize camelCase defaults on the regular tables", () => {
    const sql = db.select().from(courses).toSQL().sql

    expect(sql).toContain("`createdAt`")
    expect(sql).toContain("`updatedAt`")
  })

  it("keeps the snake_case columns declared by the legacy Task entity", () => {
    const sql = db.select().from(tasks).toSQL().sql

    expect(sql).toContain("`created_at`")
    expect(sql).toContain("`updated_at`")
    expect(sql).not.toContain("`createdAt`")
  })
})

describe("query construction", () => {
  it("builds the paginated join used by listCourses", () => {
    const { sql } = db
      .select({
        id: courses.id,
        name: courses.name,
        courseType: { id: courseTypes.id, name: courseTypes.name },
      })
      .from(courses)
      .leftJoin(courseTypes, eq(courses.course_type_id, courseTypes.id))
      .where(eq(courses.name, "Redes"))
      .orderBy(asc(courses.name))
      .limit(10)
      .offset(20)
      .toSQL()

    expect(sql).toContain(
      "left join `course_types` on `courses`.`course_type_id` = `course_types`.`id`",
    )
    expect(sql).toContain("order by `courses`.`name` asc")
    expect(sql).toContain("limit")
    expect(sql).toContain("offset")
  })

  it("builds a count query", () => {
    expect(db.select({ value: count() }).from(courses).toSQL().sql).toContain(
      "count(*)",
    )
  })

  it("builds the four joins used by listAssignments", () => {
    const { sql } = db
      .select({ id: assignments.id })
      .from(assignments)
      .leftJoin(users, eq(assignments.teacher_id, users.id))
      .leftJoin(subjects, eq(assignments.subject_id, subjects.id))
      .leftJoin(spaces, eq(assignments.space_id, spaces.id))
      .leftJoin(classGroups, eq(assignments.class_group_id, classGroups.id))
      .toSQL()

    expect(sql.match(/left join/g)).toHaveLength(4)
  })

  it("builds the assignment schedules join", () => {
    const { sql } = db
      .select({
        assignment_id: assignmentSchedules.assignment_id,
        id: schedules.id,
      })
      .from(assignmentSchedules)
      .innerJoin(schedules, eq(assignmentSchedules.schedule_id, schedules.id))
      .toSQL()

    expect(sql).toContain("inner join `schedules`")
  })

  it("builds an insert that lets MySQL generate the id", () => {
    const { sql } = db
      .insert(courses)
      .values({ name: "Redes", course_type_id: 1 })
      .toSQL()

    expect(sql).toContain("insert into `courses`")
    expect(sql).toContain("default")
  })
})
