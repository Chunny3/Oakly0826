use oakly2;

SELECT 
        o.id AS order_id,
        o.order_number,
        o.total_amount,
        o.create_at,
        o.buyer_name,
        o.buyer_email,
        o.buyer_phone,
        o.recipient_name,
        o.recipient_phone,
        o.address,
        o.delivery_method,
        o.payment_status,
        o.payment_method,
        o.coupon_id,
        oi.product_id,
        oi.quantity,
        oi.price,
        oi.size,
        oi.color,
        oi.material,
        p.name AS product_name,
        pi.url AS product_image,
        c.name AS coupon_name,
        c.discount_type,
        c.discount AS coupon_discount_value
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN (
          SELECT product_id, MIN(img) AS url
          FROM product_img
          GROUP BY product_id
      ) pi ON p.id = pi.product_id
      LEFT JOIN coupons c ON o.coupon_id = c.id
      WHERE o.user_id = 208 AND o.id = 15
      ORDER BY oi.id ASC;