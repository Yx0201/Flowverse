"use client";
import { Button, Divider, Input, Form, App } from "antd";
import type { FormRule } from "antd";
import styles from "./page.module.scss";
import LoginOutlined from "@ant-design/icons/lib/icons/LoginOutlined";
import UserAddOutlined from "@ant-design/icons/lib/icons/UserAddOutlined";
import { LOGIN_TEXT } from "./constant";
import type { LoginForm } from "./type";
import { useRouter, useSearchParams } from "next/navigation";
import { validateUser, createAuthToken } from "@/lib/auth";
import { setAuthCookie } from "@/lib/client-auth";
import { useState } from "react";

const Login = () => {

  const [form] = Form.useForm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const userNameRules: FormRule[] = [
    {
      required: true,
      message: LOGIN_TEXT.LOGIN_USER_NAME_TEXT,
    },
  ];
  const passwordRules: FormRule[] = [
    {
      required: true,
      message: LOGIN_TEXT.LOGIN_PASSWORD_TEXT,
    },
    {
      min: 6,
      message: LOGIN_TEXT.LOGIN_PASSWORD_MIN_TEXT,
    },
  ];

  const onFinish = async (values: LoginForm) => {
    setLoading(true);

    try {
      // 验证用户凭据
      const isValid = validateUser(values.email, values.password);

      if (!isValid) {
        message.error('Invalid username or password. Use yangxiao/123456');
        setLoading(false);
        return;
      }

      // 创建认证token
      const token = createAuthToken(values.email);

      // 设置cookie
      setAuthCookie(token);

      message.success('Login successful!');

      // 获取重定向地址
      const from = searchParams.get('from') || '/';

      // 延迟一秒后重定向，让用户看到成功消息
      setTimeout(() => {
        router.push(from);
      }, 1000);

    } catch (error) {
      message.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginRoot}>
      <div className={styles.loginImg}></div>
      <div className={styles.loginOption}>
        <div className={styles.loginForm}>
          <h2>{LOGIN_TEXT.LOGIN_TITLE}</h2>
          <p className="descText">{LOGIN_TEXT.LOGIN_DESC}</p>

          <Form
            form={form}
            name="loginForm"
            onFinish={onFinish}
            autoComplete="off"
            style={{ width: "100%" }}
          >
            <Form.Item name="email" rules={userNameRules}>
              <Input placeholder={LOGIN_TEXT.LOGIN_USER_NAME} />
            </Form.Item>

            <Form.Item name="password" rules={passwordRules}>
              <Input.Password placeholder={LOGIN_TEXT.LOGIN_PASSWORD} />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{ width: "100%" }}
                icon={<LoginOutlined />}
                loading={loading}
              >
                {LOGIN_TEXT.LOGIN_BUTTON_TEXT}
              </Button>
            </Form.Item>
          </Form>

          <Divider plain style={{ color: "#bfbfbf" }}>
            {LOGIN_TEXT.OR_TEXT}
          </Divider>
          <Button style={{ width: "100%" }} icon={<UserAddOutlined />}>
            {LOGIN_TEXT.LOGIN_REGISTER_TEXT}
          </Button>
          <p className="descText">{LOGIN_TEXT.LOGIN_EXPERIENCE_TEXT} </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
