import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params
    const { name, email, role, password } = await request.json()

    // Validaciones
    if (!name || !email || !role) {
      return NextResponse.json({ error: "Nombre, email y rol son obligatorios" }, { status: 400 })
    }

    if (!["tecnico", "admin", "super_admin"].includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 })
    }

    // Verificar si el email ya existe en otro usuario
    const existingUser = await query("SELECT id FROM users WHERE email = $1 AND id != $2", [email, id])
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: "El email ya está registrado por otro usuario" }, { status: 400 })
    }

    let updateQuery = "UPDATE users SET name = $1, email = $2, role = $3"
    const params_array = [name, email, role]

    // Si se proporciona nueva contraseña, incluirla en la actualización
    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
      }
      const hashedPassword = await bcrypt.hash(password, 12)
      updateQuery += ", password_hash = $4 WHERE id = $5"
      params_array.push(hashedPassword, id)
    } else {
      updateQuery += " WHERE id = $4"
      params_array.push(id)
    }

    await query(updateQuery, params_array)

    return NextResponse.json({ message: "Usuario actualizado exitosamente" })
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params

    // Verificar que el usuario existe
    const userExists = await query("SELECT id FROM users WHERE id = $1", [id])
    if (userExists.rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    await query("DELETE FROM notifications WHERE sent_to = $1", [id])

    // Eliminar el usuario
    await query("DELETE FROM users WHERE id = $1", [id])

    return NextResponse.json({ message: "Usuario eliminado exitosamente" })
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userRole = request.headers.get("x-user-role")

    if (!userRole || !["admin", "super_admin"].includes(userRole)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params

    const result = await query("SELECT id, email, name, role, is_active, created_at FROM users WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
