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
import { useState, useRef, useEffect } from "react";

const Login = () => {
  const [form] = Form.useForm();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  /////////////////////////
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [animationStage, setAnimationStage] = useState(0);
  const [isEditable, setIsEditable] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

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
        message.error("Invalid username or password. Use yangxiao/123456");
        setLoading(false);
        return;
      }

      // 创建认证token
      const token = createAuthToken(values.email);

      // 设置cookie
      setAuthCookie(token);

      message.success("Login successful!");
      setIsLoggedIn(true);
      // 第一步：表单消失
      setTimeout(() => setAnimationStage(1), 50);
      // 第二步：尺寸+定位同步变换
      setTimeout(() => setAnimationStage(2), 400);
      // 第三步：背景颜色和边框变换
      setTimeout(() => setAnimationStage(3), 1200);
      // 第四步：启用编辑
      setTimeout(() => {
        setAnimationStage(4);
        setIsEditable(true);
      }, 2000);

      // // 获取重定向地址
      // const from = searchParams.get("from") || "/";

      // // 延迟一秒后重定向，让用户看到成功消息
      // setTimeout(() => {
      //   router.push(from);
      // }, 1000);
    } catch (error) {
      console.log(error);
      message.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditable]);

  const getBoxStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };

    // 初始状态 & 表单消失阶段
    if (animationStage <= 1) {
      return {
        ...baseStyle,
        width: "40vw",
        height: "100vh",
        backgroundColor: "white",
        border: "none",
        borderRadius: "10px 0 0 10px",
        right: "0",
        top: "0",
        transition: "none",
      };
    }

    // 第二步：尺寸和定位同步变换
    if (animationStage === 2) {
      return {
        ...baseStyle,
        width: "500px",
        height: "200px",
        backgroundColor: "white",
        border: "none",
        borderRadius: "30px",
        right: "50%",
        top: "50%",
        transform: "translate(50%, -50%)",
        transition:
          "width 0.8s ease-out, height 0.8s ease-out, border-radius 0.8s ease-out, right 0.8s ease-out, top 0.8s ease-out, transform 0.8s ease-out",
      };
    }

    // 第三步：背景颜色和边框变换
    if (animationStage === 3) {
      return {
        ...baseStyle,
        width: "500px",
        height: "200px",
        backgroundColor: "black",
        border: "2px solid white",
        borderRadius: "30px",
        right: "50%",
        top: "50%",
        transform: "translate(50%, -50%)",
        transition: "background-color 0.8s ease-out, border 0.8s ease-out",
      };
    }

    // 第四步：完成状态
    return {
      ...baseStyle,
      width: "500px",
      height: "200px",
      backgroundColor: "black",
      border: "2px solid white",
      borderRadius: "30px",
      right: "50%",
      top: "50%",
      transform: "translate(50%, -50%)",
      transition: "none",
    };
  };

  return (
    <div className={styles.loginRoot}       style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "black",
        position: "relative",
        overflow: "hidden",
      }}>
      <div className={styles.loginImg}></div>
      <div className={styles.loginOption} style={getBoxStyle()}>
        {animationStage < 2 && (
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
        )}
             {/* 可编辑区域 */}
      {isEditable && (
        <div
          ref={inputRef}
          contentEditable
          suppressContentEditableWarning
          style={{
            width: "calc(100% - 40px)",
            height: "calc(100% - 40px)",
            color: "white",
            fontSize: "16px",
            outline: "none",
            padding: "10px",
            boxSizing: "border-box",
            overflow: "auto",
            caretColor: "white",
          }}
          data-placeholder="在这里输入..."
        />
      )}
      </div>
 
           <style jsx>{`
        div[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.5);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default Login;
