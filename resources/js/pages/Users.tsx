import { useForm } from "@inertiajs/react";
import { UserPlus } from "lucide-react";
import Layout, { Errors, PageHeading } from "../components/Layout";
import { roles, type User } from "../types";
export default function Users({ users }: { users: User[] }) {
    const form = useForm({
        name: "",
        email: "",
        role: "resident",
        room: "",
        password: "",
    });
    return (
        <Layout title="ผู้ใช้งาน">
            <PageHeading
                title="ทุกคนในอาคาร"
                subtitle="สร้างบัญชีให้ผู้พักและช่าง โดยผู้ดูแลเป็นผู้กำหนดสิทธิ์"
            />
            <div className="users-grid">
                <section className="panel">
                    <div className="section-heading">
                        <h2>บัญชีผู้ใช้งาน</h2>
                        <span>{users.length} บัญชี</span>
                    </div>
                    <div className="users-list">
                        {users.map((u) => (
                            <article key={u.id}>
                                <span className="avatar">
                                    {u.name.slice(0, 1)}
                                </span>
                                <div>
                                    <strong>{u.name}</strong>
                                    <small>{u.email}</small>
                                </div>
                                <span className="role-tag">
                                    {roles[u.role]}
                                    {u.room && ` · ${u.room}`}
                                </span>
                            </article>
                        ))}
                    </div>
                </section>
                <form
                    className="panel form-panel"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post("/users", {
                            onSuccess: () => form.reset(),
                            onFinish: () => form.reset("password"),
                        });
                    }}
                >
                    <h2>
                        <UserPlus size={19} />
                        เพิ่มบัญชี
                    </h2>
                    <label>
                        ชื่อผู้ใช้งาน
                        <input
                            required
                            maxLength={80}
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData("name", e.target.value)
                            }
                        />
                    </label>
                    <label>
                        อีเมล
                        <input
                            required
                            type="email"
                            value={form.data.email}
                            onChange={(e) =>
                                form.setData("email", e.target.value)
                            }
                        />
                    </label>
                    <label>
                        บทบาท
                        <select
                            value={form.data.role}
                            onChange={(e) =>
                                form.setData("role", e.target.value)
                            }
                        >
                            <option value="resident">ผู้พักอาศัย</option>
                            <option value="technician">ช่างซ่อม</option>
                        </select>
                    </label>
                    {form.data.role === "resident" && (
                        <label>
                            เลขห้อง
                            <input
                                required
                                maxLength={20}
                                value={form.data.room}
                                onChange={(e) =>
                                    form.setData("room", e.target.value)
                                }
                                placeholder="เช่น A-203"
                            />
                        </label>
                    )}
                    <label>
                        รหัสผ่านเริ่มต้น
                        <input
                            required
                            type="password"
                            autoComplete="new-password"
                            minLength={12}
                            maxLength={200}
                            value={form.data.password}
                            onChange={(e) =>
                                form.setData("password", e.target.value)
                            }
                        />
                        <small>
                            อย่างน้อย 12 ตัวอักษร
                            แจ้งเจ้าของบัญชีผ่านช่องทางส่วนตัว
                        </small>
                    </label>
                    <Errors errors={form.errors} />
                    <button className="primary" disabled={form.processing}>
                        สร้างบัญชี
                    </button>
                </form>
            </div>
        </Layout>
    );
}
