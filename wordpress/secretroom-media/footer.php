<footer class="site-footer"><div class="wrap">
  <div class="footer-grid">
    <div>
      <a class="logo" href="<?php echo esc_url(home_url('/')); ?>" style="margin-bottom:14px">
        <img class="logo-img" src="<?php echo esc_url(srm_logo_url()); ?>" alt="" style="height:36px;width:auto">
        <span class="name" style="color:var(--paper)">Secret Room<span>MEDIA</span></span>
      </a>
      <p style="color:#b8b4a8;max-width:40ch;font-size:14px">Дерзкий бэкстейдж iGaming-рынка. Скандалы, разборы и самые свежие новости индустрии.</p>
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
      <h4>Темы</h4>
      <?php
      $cats = ['Регуляторы', 'Скандалы', 'Казино', 'Конференции'];
      foreach ($cats as $name) {
          $term = get_term_by('name', $name, 'category');
          if ($term) {
              echo '<a href="' . esc_url(get_term_link($term)) . '">' . esc_html($name) . '</a>';
          }
      }
      ?>
    </div>
    <div>
      <h4>Контакты</h4>
      <a href="https://t.me/+KXGg4OHsar0xYWRi" target="_blank" rel="noopener">Telegram-канал</a>
      <a href="<?php echo esc_url(srm_page_url('careers')); ?>">Реклама и сотрудничество</a>
      <a href="<?php echo esc_url(admin_url()); ?>">Вход для редакции</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© <?php echo esc_html(date('Y')); ?> Secret Room Media. Все права дерзко защищены.</span>
    <span>18+ · Материалы носят информационный характер</span>
  </div>
</div></footer>

<?php wp_footer(); ?>
</body>
</html>
