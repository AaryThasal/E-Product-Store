import { sql } from '../config/db.js';

export const getProducts = async (req, res) => {
  try {
    const product = await sql`
      SELECT * FROM products
      ORDER BY created_at DESC
    `;

    console.log("fetched products",product);
    res.status(200).json({success: true, data: product});
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({success: false, message: "Server Error"});
  }
};

export const createProduct = async (req, res) => {
  const { name, image, price } = req.body;

  if(!name || !image || !price) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  try {
    const newProduct = await sql`
      INSERT INTO products (name, image, price)
      VALUES (${name}, ${image}, ${price})
      RETURNING *
    `;

    console.log("Created product:", newProduct[0]);
    res.status(201).json({success: true, data: newProduct[0]});

  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({success: false, message: "Server Error"});
  }
};  

export const getProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await sql`
      SELECT * FROM products WHERE id = ${id}
    `;

    res.status(200).json({ success: true, data: product[0] });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};      

export const updateProduct = async (req, res) => {    
  const { id } = req.params;
  const { name, image, price } = req.body;

  try {
    const updateProduct = await sql`
      UPDATE products
      SET name = ${name}, image = ${image}, price = ${price}
      WHERE id = ${id}
      RETURNING *
    `; 
    
    if (updateProduct.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: updateProduct[0] });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }

};  

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteProduct = await sql`
      DELETE FROM products WHERE id = ${id} RETURNING *
    `;   
    if (deleteProduct.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }   

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  } 
};  