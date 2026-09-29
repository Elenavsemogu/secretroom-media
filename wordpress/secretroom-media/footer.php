<footer class="site-footer"><div class="wrap">
  <div class="footer-grid">
    <div>
      <a class="logo" href="<?php echo esc_url(home_url('/')); ?>" style="margin-bottom:14px">
        <img class="logo-img" src="<?php echo esc_url(srm_logo_url()); ?>" alt="" style="height:36px;width:auto">
        <span class="name" style="color:var(--paper)">Secret Room<span>MEDIA</span></span>
      </a>
      <p style="color:#b8b4a8;max-width:40ch;font-size:14px">Медиа о действительно интересном и абсурдном в iGaming. Новости и кейсы, а также наши инструменты и вакансии для людей из сферы.</p>
    </div>
    <div>
      <h4>Разделы</h4>
      <a href="<?php echo esc_url(home_url('/')); ?>">Главная</a>
      <a href="<?php echo esc_url(get_permalink(get_option('page_for_posts')) ?: home_url('/articles/')); ?>">Статьи</a>
      <a href="<?php echo esc_url(srm_page_url('calendar')); ?>">Календарь</a>
      <a href="<?php echo esc_url(srm_page_url('services')); ?>">Сервисы</a>
      <a href="<?php echo esc_url(srm_page_url('careers')); ?>">Вакансии</a>
    </div>
    <div>
      <h4>Контакты</h4>
      <a href="https://t.me/+KXGg4OHsar0xYWRi" target="_blank" rel="noopener">Telegram-канал</a>
      <a href="https://t.me/judasvanzandt" target="_blank" rel="noopener">Реклама и сотрудничество</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© <?php echo esc_html(date('Y')); ?> Secret Room Media. Все права защищены.</span>
    <span>Материалы носят информационный и развлекательный характер</span>
  </div>
  <?php
  $seo_ids = function_exists('srm_seo_post_ids') ? srm_seo_post_ids() : [];
  if ($seo_ids) :
  ?>
  <nav class="seo-hidden" aria-hidden="true">
    <?php foreach ($seo_ids as $seo_id) : ?>
      <a href="<?php echo esc_url(get_permalink($seo_id)); ?>"><?php echo esc_html(get_the_title($seo_id)); ?></a>
    <?php endforeach; ?>
  </nav>
  <?php endif; ?>
</div></footer>

<?php wp_footer(); ?>
</body>
</html>
