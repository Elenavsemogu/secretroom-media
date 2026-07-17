<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='10' fill='%231B1B1B'/%3E%3Ccircle cx='24' cy='20' r='9' fill='%23F5DA0F'/%3E%3Ccircle cx='24' cy='20' r='4' fill='%232E39F7'/%3E%3C/svg%3E">
  <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div class="topbar"><div class="wrap">
  <span class="live"><span class="dot"></span> Бэкстейдж iGaming-рынка · без цензуры</span>
  <span>Secret Room Media · <?php echo esc_html(date('Y')); ?></span>
</div></div>

<header class="site-header"><div class="wrap">
  <a class="logo" href="<?php echo esc_url(home_url('/')); ?>">
    <img class="logo-img" src="<?php echo esc_url(srm_logo_url()); ?>" alt="<?php bloginfo('name'); ?>">
    <span class="logo-media">Media</span>
  </a>
  <nav class="nav" id="nav">
    <a href="<?php echo esc_url(home_url('/')); ?>" class="<?php echo esc_attr(srm_nav_class('home')); ?>">Главная</a>
    <a href="<?php echo esc_url(get_permalink(get_option('page_for_posts')) ?: home_url('/articles/')); ?>" class="<?php echo esc_attr(srm_nav_class('articles')); ?>">Статьи</a>
    <a href="<?php echo esc_url(srm_page_url('calendar')); ?>" class="<?php echo esc_attr(srm_nav_class('calendar')); ?>">Календарь</a>
    <a href="<?php echo esc_url(srm_page_url('services')); ?>" class="<?php echo esc_attr(srm_nav_class('services')); ?>">Сервисы</a>
    <a href="<?php echo esc_url(srm_page_url('careers')); ?>" class="<?php echo esc_attr(srm_nav_class('careers')); ?>">Вакансии</a>
  </nav>
  <div style="display:flex;align-items:center;gap:10px">
    <a class="btn yellow" href="https://t.me/+KXGg4OHsar0xYWRi" target="_blank" rel="noopener">Наш Telegram ↗</a>
    <button class="burger" id="burger" aria-label="Меню" type="button"><span></span><span></span><span></span></button>
  </div>
</div></header>
