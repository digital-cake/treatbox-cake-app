<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDefaultProductLeadTimesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('default_product_lead_times', function (Blueprint $table) {
            $table->id();
            $table->string('shop');
            $table->integer('day_index');
            $table->integer('lead_time');
            $table->string('cut_off_time');
            $table->integer('post_cut_off_lead_time');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('default_product_lead_times');
    }
}
