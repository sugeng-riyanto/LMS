# Role-Based Access Control (RBAC)

## Roles Definition
1. super_admin (Guru Fisika - You)
   - Full system access
   - Can trigger agent generation
   - Can approve/edit packages
   - Can upload XLSX calendar
   - Can manage users

2. teacher (Other subject teachers - read-only observer)
   - Can view published packages
   - Cannot edit or approve

3. lab_assistant (Laboran)
   - Can read lab logistics from packages
   - Can update lab_inventory table
   - Cannot view lesson plans or student data

4. student
   - Can read published packages for their own grade ONLY
   - Can write to their own mistake_journals
   - Cannot see other grades or teacher notes

## Supabase RLS Policies

### users table
    CREATE POLICY "Super Admin full access" ON users
        FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin');
    CREATE POLICY "Teachers can read all" ON users
        FOR SELECT USING (auth.jwt() ->> 'role' IN ('teacher', 'super_admin'));

### weekly_packages table
    CREATE POLICY "Admin CRUD" ON weekly_packages
        FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin');
    CREATE POLICY "Lab assistant reads logistics" ON weekly_packages
        FOR SELECT USING (
            auth.jwt() ->> 'role' = 'lab_assistant'
        );
    CREATE POLICY "Students read published own grade" ON weekly_packages
        FOR SELECT USING (
            auth.jwt() ->> 'role' = 'student'
            AND status = 'published'
            AND grade = (auth.jwt() ->> 'grade_assigned')::int
        );

### class_memory table
    CREATE POLICY "Admin only" ON class_memory
        FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin');

### lab_inventory table
    CREATE POLICY "Admin full, Lab read+update" ON lab_inventory
        FOR ALL USING (auth.jwt() ->> 'role' IN ('super_admin', 'lab_assistant'));

### mistake_journals table
    CREATE POLICY "Students own entries" ON mistake_journals
        FOR ALL USING (
            auth.jwt() ->> 'role' = 'student'
            AND student_id = auth.uid()
        );
    CREATE POLICY "Admin reads all" ON mistake_journals
        FOR SELECT USING (auth.jwt() ->> 'role' = 'super_admin');

## Permission Matrix Summary
| Action                        | Super Admin | Teacher | Lab Assistant | Student |
|-------------------------------|:-----------:|:-------:|:-------------:|:-------:|
| Generate Weekly Package       | YES         | NO      | NO            | NO      |
| Review & Approve Package      | YES         | NO      | NO            | NO      |
| Edit Lesson Plan / Worksheet  | YES         | NO      | NO            | NO      |
| View Published Package        | YES         | YES     | YES           | YES*    |
| View Lab Logistics            | YES         | NO      | YES           | NO      |
| Update Lab Inventory          | YES         | NO      | YES           | NO      |
| View Class Memory             | YES         | NO      | NO            | NO      |
| Add to Mistake Journal        | YES         | NO      | NO            | YES**   |
| Upload XLSX Calendar          | YES         | NO      | NO            | NO      |
| Manage Users & Roles          | YES         | NO      | NO            | NO      |

* Students can only see packages for their assigned grade
** Students can only edit their own journal entries
