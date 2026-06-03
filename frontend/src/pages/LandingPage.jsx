import { useNavigate } from 'react-router-dom';
import { Button, Col, Row, Typography, Card, Space, Divider, Select, Collapse, Tag } from 'antd';
import {
  SafetyCertificateOutlined, FileTextOutlined, BarChartOutlined, TeamOutlined,
  LockOutlined, GlobalOutlined, CheckCircleOutlined, SolutionOutlined,
  BookOutlined, ThunderboltOutlined, MobileOutlined, AuditOutlined,
  QuestionCircleOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined,
  ClockCircleOutlined, StarFilled,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text, Paragraph } = Typography;
const PRIMARY = '#1677ff';
const DARK    = '#0a1628';
const LIGHT   = '#f5f8ff';

const LANGUAGES = [
  { value: 'en', label: '🇬🇧 EN' },
  { value: 'az', label: '🇦🇿 AZ' },
  { value: 'ru', label: '🇷🇺 RU' },
];

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

function Section({ id, children, bg = '#fff', style = {} }) {
  return (
    <section id={id} style={{ background: bg, padding: '80px 24px', ...style }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 48 }}>
      <Title level={2} style={{ color: DARK, margin: '0 0 12px' }}>{title}</Title>
      <Text type="secondary" style={{ fontSize: 16 }}>{subtitle}</Text>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <Card bordered={false} style={{ height: '100%', borderRadius: 12, boxShadow: '0 2px 16px rgba(22,119,255,0.07)' }} bodyStyle={{ padding: 28 }}>
      <div style={{ fontSize: 32, color: PRIMARY, marginBottom: 16 }}>{icon}</div>
      <Title level={5} style={{ margin: '0 0 8px' }}>{title}</Title>
      <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>{desc}</Text>
    </Card>
  );
}

function StepCard({ num, icon, title, desc }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 8px' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: PRIMARY, color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontWeight: 700 }}>{num}</div>
      <div style={{ fontSize: 26, color: PRIMARY, marginBottom: 10 }}>{icon}</div>
      <Title level={5} style={{ margin: '0 0 8px' }}>{title}</Title>
      <Text type="secondary" style={{ fontSize: 14 }}>{desc}</Text>
    </div>
  );
}

function RoleCard({ role, color, icon, items }) {
  return (
    <Card style={{ borderRadius: 12, borderTop: `4px solid ${color}`, height: '100%' }} bodyStyle={{ padding: 24 }}>
      <Space style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 22, color }}>{icon}</span>
        <Title level={5} style={{ margin: 0, color }}>{role}</Title>
      </Space>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((item, i) => <li key={i} style={{ marginBottom: 6 }}><Text style={{ fontSize: 14 }}>{item}</Text></li>)}
      </ul>
    </Card>
  );
}

function PlanCard({ name, price, period, desc, features, btnLabel, highlight, onGetStarted }) {
  return (
    <Card
      bordered={false}
      style={{
        height: '100%', borderRadius: 16, textAlign: 'center',
        border: highlight ? `2px solid ${PRIMARY}` : '1px solid #e8e8e8',
        boxShadow: highlight ? '0 8px 32px rgba(22,119,255,0.18)' : '0 2px 8px rgba(0,0,0,0.06)',
        position: 'relative', overflow: 'visible',
      }}
      bodyStyle={{ padding: '32px 24px' }}
    >
      {highlight && (
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)' }}>
          <Tag color={PRIMARY} icon={<StarFilled />} style={{ borderRadius: 20, padding: '2px 14px', fontSize: 12 }}>
            Most Popular
          </Tag>
        </div>
      )}
      <Title level={4} style={{ margin: '0 0 8px', color: highlight ? PRIMARY : DARK }}>{name}</Title>
      <div style={{ margin: '16px 0 8px' }}>
        <span style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 800, color: highlight ? PRIMARY : DARK }}>{price}</span>
        {period && <span style={{ color: '#888', fontSize: 15 }}> {period}</span>}
      </div>
      <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 24 }}>{desc}</Text>
      <Button
        type={highlight ? 'primary' : 'default'}
        size="large"
        block
        style={{ marginBottom: 24, borderRadius: 8 }}
        onClick={onGetStarted}
      >
        {btnLabel}
      </Button>
      <Divider style={{ margin: '0 0 16px' }} />
      <ul style={{ textAlign: 'left', margin: 0, paddingLeft: 20 }}>
        {features.map((f, i) => (
          <li key={i} style={{ marginBottom: 8 }}>
            <Space size={6}>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text style={{ fontSize: 14 }}>{f}</Text>
            </Space>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function LandingPage() {
  const navigate  = useNavigate();
  const { t, i18n } = useTranslation();
  const L = (k) => t(`landing.${k}`);

  const changeLanguage = (lang) => { i18n.changeLanguage(lang); localStorage.setItem('bsq_lang', lang); };

  const features = [
    { icon: <LockOutlined />,        title: L('feat1Title'), desc: L('feat1Desc') },
    { icon: <ThunderboltOutlined />, title: L('feat2Title'), desc: L('feat2Desc') },
    { icon: <SolutionOutlined />,    title: L('feat3Title'), desc: L('feat3Desc') },
    { icon: <BarChartOutlined />,    title: L('feat4Title'), desc: L('feat4Desc') },
    { icon: <AuditOutlined />,       title: L('feat5Title'), desc: L('feat5Desc') },
    { icon: <FileTextOutlined />,    title: L('feat6Title'), desc: L('feat6Desc') },
    { icon: <GlobalOutlined />,      title: L('feat7Title'), desc: L('feat7Desc') },
    { icon: <MobileOutlined />,      title: L('feat8Title'), desc: L('feat8Desc') },
  ];

  const steps = [
    { num: 1, icon: <BookOutlined />,     title: L('step1Title'), desc: L('step1Desc') },
    { num: 2, icon: <FileTextOutlined />, title: L('step2Title'), desc: L('step2Desc') },
    { num: 3, icon: <TeamOutlined />,     title: L('step3Title'), desc: L('step3Desc') },
    { num: 4, icon: <LockOutlined />,     title: L('step4Title'), desc: L('step4Desc') },
    { num: 5, icon: <BarChartOutlined />, title: L('step5Title'), desc: L('step5Desc') },
  ];

  const roles = [
    { role: L('role1'), color: '#722ed1', icon: <SafetyCertificateOutlined />, items: [L('role1item1'), L('role1item2'), L('role1item3'), L('role1item4')] },
    { role: L('role2'), color: PRIMARY,   icon: <AuditOutlined />,             items: [L('role2item1'), L('role2item2'), L('role2item3'), L('role2item4')] },
    { role: L('role3'), color: '#13c2c2', icon: <SolutionOutlined />,          items: [L('role3item1'), L('role3item2'), L('role3item3'), L('role3item4')] },
    { role: L('role4'), color: '#52c41a', icon: <TeamOutlined />,              items: [L('role4item1'), L('role4item2'), L('role4item3'), L('role4item4')] },
  ];

  const plans = [
    {
      name: L('plan1Name'), price: L('plan1Price'), period: L('plan1Period'),
      desc: L('plan1Desc'), btnLabel: L('plan1Btn'), highlight: false,
      features: [L('plan1f1'), L('plan1f2'), L('plan1f3'), L('plan1f4'), L('plan1f5')],
      onGetStarted: () => navigate('/login'),
    },
    {
      name: L('plan2Name'), price: L('plan2Price'), period: L('plan2Period'),
      desc: L('plan2Desc'), btnLabel: L('plan2Btn'), highlight: true,
      features: [L('plan2f1'), L('plan2f2'), L('plan2f3'), L('plan2f4'), L('plan2f5'), L('plan2f6')],
      onGetStarted: () => navigate('/login'),
    },
    {
      name: L('plan3Name'), price: L('plan3Price'), period: L('plan3Period'),
      desc: L('plan3Desc'), btnLabel: L('plan3Btn'), highlight: false,
      features: [L('plan3f1'), L('plan3f2'), L('plan3f3'), L('plan3f4'), L('plan3f5')],
      onGetStarted: () => scrollTo('contact'),
    },
  ];

  const faqs = [
    { key: '1', label: L('faq1Q'), children: <Text>{L('faq1A')}</Text> },
    { key: '2', label: L('faq2Q'), children: <Text>{L('faq2A')}</Text> },
    { key: '3', label: L('faq3Q'), children: <Text>{L('faq3A')}</Text> },
    { key: '4', label: L('faq4Q'), children: <Text>{L('faq4A')}</Text> },
    { key: '5', label: L('faq5Q'), children: <Text>{L('faq5A')}</Text> },
  ];

  const contacts = [
    { icon: <MailOutlined />,        label: L('contactEmail'),   value: L('contactEmailVal') },
    { icon: <PhoneOutlined />,       label: L('contactPhone'),   value: L('contactPhoneVal') },
    { icon: <EnvironmentOutlined />, label: L('contactAddress'), value: L('contactAddressVal') },
    { icon: <ClockCircleOutlined />, label: L('contactHours'),   value: L('contactHoursVal') },
  ];

  const navLinks = [
    { label: L('navHome'),    id: 'hero' },
    { label: L('navPricing'), id: 'pricing' },
    { label: L('navFaq'),     id: 'faq' },
    { label: L('navContact'), id: 'contact' },
  ];

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* ── NAV ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <SafetyCertificateOutlined style={{ fontSize: 24, color: PRIMARY }} />
          <span style={{ fontWeight: 800, fontSize: 18, color: DARK }}>BSQ Portal</span>
        </div>

        {/* Centre nav links — hidden on small screens */}
        <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="landing-nav">
          {navLinks.map(({ label, id }) => (
            <Button key={id} type="text" onClick={() => scrollTo(id)} style={{ fontWeight: 500, color: '#333' }}>
              {label}
            </Button>
          ))}
        </nav>

        <Space size={8} style={{ flexShrink: 0 }}>
          <Select value={i18n.language} onChange={changeLanguage} options={LANGUAGES} style={{ width: 80 }} variant="borderless" size="small" />
          <Button type="primary" onClick={() => navigate('/login')}>{L('signIn')}</Button>
        </Space>
      </header>

      {/* ── HERO ── */}
      <section id="hero" style={{ background: `linear-gradient(135deg, ${DARK} 0%, #1a3a6e 100%)`, padding: 'clamp(60px,10vw,100px) 24px 80px', textAlign: 'center', color: '#fff' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: '6px 18px', fontSize: 13, marginBottom: 24, letterSpacing: 1, fontWeight: 600 }}>
            {L('heroBadge')}
          </div>
          <Title style={{ color: '#fff', fontSize: 'clamp(28px,5vw,52px)', lineHeight: 1.2, margin: '0 0 20px' }}>
            {L('heroTitle')}
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.78)', fontSize: 'clamp(15px,2vw,18px)', maxWidth: 580, margin: '0 auto 36px' }}>
            {L('heroSubtitle')}
          </Paragraph>
          <Space size={12} wrap style={{ justifyContent: 'center' }}>
            <Button type="primary" size="large" style={{ height: 48, paddingInline: 32, fontSize: 16 }} onClick={() => navigate('/login')}>
              {L('getStarted')}
            </Button>
            <Button size="large" ghost style={{ height: 48, paddingInline: 32, fontSize: 16 }} onClick={() => scrollTo('pricing')}>
              {L('navPricing')}
            </Button>
          </Space>
          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 'clamp(12px,3vw,32px)', flexWrap: 'wrap' }}>
            {[L('trustOtp'), L('trustRealtime'), L('trustRoles'), L('trustPdf')].map((tag) => (
              <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> {tag}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <Section id="features" bg={LIGHT}>
        <SectionHeader title={L('featuresTitle')} subtitle={L('featuresSubtitle')} />
        <Row gutter={[24, 24]}>
          {features.map((f) => <Col key={f.title} xs={24} sm={12} lg={6}><FeatureCard {...f} /></Col>)}
        </Row>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section id="how">
        <SectionHeader title={L('howTitle')} subtitle={L('howSubtitle')} />
        <Row gutter={[24, 40]}>
          {steps.map((s) => <Col key={s.num} xs={24} sm={12} md={8} lg={24 / 5}><StepCard {...s} /></Col>)}
        </Row>
      </Section>

      {/* ── ROLES ── */}
      <Section id="roles" bg={LIGHT}>
        <SectionHeader title={L('rolesTitle')} subtitle={L('rolesSubtitle')} />
        <Row gutter={[24, 24]}>
          {roles.map((r) => <Col key={r.role} xs={24} sm={12} lg={6}><RoleCard {...r} /></Col>)}
        </Row>
      </Section>

      {/* ── STATS ── */}
      <section style={{ background: PRIMARY, padding: '60px 24px', textAlign: 'center' }}>
        <Row gutter={[40, 32]} justify="center" style={{ maxWidth: 900, margin: '0 auto' }}>
          {[
            { val: L('stat1Val'), label: L('stat1Label') },
            { val: L('stat2Val'), label: L('stat2Label') },
            { val: L('stat3Val'), label: L('stat3Label') },
            { val: L('stat4Val'), label: L('stat4Label') },
          ].map(({ val, label }) => (
            <Col key={label} xs={12} sm={6}>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 'clamp(32px,5vw,44px)', fontWeight: 800, lineHeight: 1 }}>{val}</div>
                <div style={{ opacity: 0.75, marginTop: 6, fontSize: 15 }}>{label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* ── PRICING ── */}
      <Section id="pricing">
        <SectionHeader title={L('pricingTitle')} subtitle={L('pricingSubtitle')} />
        <Row gutter={[24, 24]} align="stretch">
          {plans.map((p) => (
            <Col key={p.name} xs={24} sm={24} md={8}>
              <PlanCard {...p} />
            </Col>
          ))}
        </Row>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq" bg={LIGHT}>
        <SectionHeader title={L('faqTitle')} subtitle={L('faqSubtitle')} />
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <Collapse
            accordion
            items={faqs}
            size="large"
            style={{ background: '#fff', borderRadius: 12 }}
            expandIcon={({ isActive }) => <QuestionCircleOutlined style={{ color: PRIMARY, fontSize: 18, transform: isActive ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />}
          />
        </div>
      </Section>

      {/* ── CONTACT ── */}
      <Section id="contact">
        <SectionHeader title={L('contactTitle')} subtitle={L('contactSubtitle')} />
        <Row gutter={[24, 24]} justify="center">
          {contacts.map(({ icon, label, value }) => (
            <Col key={label} xs={24} sm={12} md={6}>
              <Card bordered={false} style={{ textAlign: 'center', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', height: '100%' }} bodyStyle={{ padding: 28 }}>
                <div style={{ fontSize: 32, color: PRIMARY, marginBottom: 12 }}>{icon}</div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
                <Text strong style={{ fontSize: 15 }}>{value}</Text>
              </Card>
            </Col>
          ))}
        </Row>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Button type="primary" size="large" style={{ height: 48, paddingInline: 32 }} onClick={() => navigate('/login')}>
            {L('ctaBtn')}
          </Button>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer style={{ background: DARK, color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '28px 24px', fontSize: 14 }}>
        <Space split={<Divider type="vertical" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />} wrap style={{ justifyContent: 'center' }}>
          <span>© 2026 BSQ Portal</span>
          <span>{L('footerTagline')}</span>
          <Space size={4}>
            {navLinks.map(({ label, id }) => (
              <Button key={id} type="text" size="small" style={{ color: 'rgba(255,255,255,0.5)', padding: '0 6px' }} onClick={() => scrollTo(id)}>
                {label}
              </Button>
            ))}
          </Space>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <GlobalOutlined /> EN · AZ · RU
          </span>
        </Space>
      </footer>

      {/* Hide nav links on small screens */}
      <style>{`
        @media (max-width: 768px) { .landing-nav { display: none !important; } }
      `}</style>
    </div>
  );
}
